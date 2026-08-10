// Completed reviews are the source of truth for SRS state. Everything else in
// this file is derived from that history and can be rebuilt by replaying it.
// A review counts as completed exactly when it has a rating; its `date` is then
// the day it happened.
//
// Review dates are calendar dates, not timestamps. We represent them as UTC
// midnight while inside ts-fsrs so a replay never depends on the local timezone
// or wall clock of the machine running it.
import { DateTime } from 'luxon'
import * as fsrs from 'ts-fsrs'

import { assertIsoDate } from '../../../shared/date'
import type { MutationCtx } from '../../_generated/server'
import { assertNonNull } from '../../utils/assertNonNull'
import type { ReviewCard } from '../../validators/reviewCards'
import type { Review } from '../../validators/reviews'

export type ReviewCardSrsState = Pick<
	ReviewCard,
	'stability' | 'difficulty' | 'state' | 'step' | 'lastReviewedAt'
> & { dueDate: string }

export type ReviewSrsPatch = Pick<
	Review,
	'stabilityBefore' | 'difficultyBefore' | 'stepBefore' | 'stepAfter'
> &
	Required<
		Pick<
			Review,
			| 'stateBefore'
			| 'dueDateBefore'
			| 'stabilityAfter'
			| 'difficultyAfter'
			| 'stateAfter'
			| 'dueDateAfter'
		>
	>

export interface ReplayResult {
	reviewPatches: Array<{ review: Review; patch: ReviewSrsPatch }>
	cardState: ReviewCardSrsState
}

const REQUEST_RETENTION = 0.85
const fsrsScheduler = fsrs.fsrs({ request_retention: REQUEST_RETENTION })

/**
 * Recompute and persist a card's SRS state from the first affected day.
 *
 * Callers must verify ownership before entering this helper. All reads and
 * writes stay in the caller's mutation so a review edit and its derived state
 * commit atomically.
 */
export async function updateCardSrs(
	ctx: MutationCtx,
	card: ReviewCard,
	startingFrom: string, // an isoDate
): Promise<void> {
	// Only the suffix at or after the changed date needs to be replayed. The
	// latest completed review before it is enough to reconstruct the starting
	// scheduler state.
	const reviews = (
		await ctx.db
			.query('reviews')
			.withIndex('by_reviewCardId_date', query =>
				query.eq('reviewCardId', card._id).gte('date', startingFrom),
			)
			.order('asc')
			.collect()
	).filter(review => review.rating !== undefined)

	// Convex sorts `undefined` before strings. The empty-string lower bound
	// excludes undated reviews while preserving every valid date-only value.
	// Scheduled-but-unrated reviews still land in this range, so walk backwards
	// to the nearest rated one rather than taking the first row.
	let previousReview: Review | undefined
	for await (const candidate of ctx.db
		.query('reviews')
		.withIndex('by_reviewCardId_date', query =>
			query
				.eq('reviewCardId', card._id)
				.gte('date', '')
				.lt('date', startingFrom),
		)
		.order('desc')) {
		if (candidate.rating !== undefined) {
			previousReview = candidate
			break
		}
	}

	const { reviewPatches, cardState } = replay({ previousReview, reviews })

	for (const { review, patch } of reviewPatches) {
		await ctx.db.patch('reviews', review._id, patch)
	}

	await ctx.db.patch('reviewCards', card._id, {
		stability: cardState.stability,
		difficulty: cardState.difficulty,
		state: cardState.state,
		step: cardState.step,
		// An empty replay uses an epoch-backed ts-fsrs card internally. It is not
		// a real schedule, so clearing the final completed review must clear dueDate.
		dueDate:
			cardState.lastReviewedAt === undefined
				? undefined
				: cardState.dueDate,
		// Preserve the date of a legacy seed whose SRS snapshot was incomplete.
		lastReviewedAt: cardState.lastReviewedAt ?? previousReview?.date,
	})
}

/**
 * Replay the part of a card's history affected by a review change.
 *
 * This function is deliberately independent of Convex. Keeping the scheduling
 * loop pure makes historical edits deterministic and gives callers the exact
 * database patches to persist in their own transaction.
 */
export function replay({
	previousReview,
	reviews,
}: {
	previousReview?: Review
	reviews: ReadonlyArray<Review>
}): ReplayResult {
	const reviewPatches: ReplayResult['reviewPatches'] = []
	const completedReviews = reviews.map(review => {
		if (review.date === undefined) throw new Error('Review is missing date')
		if (review.rating === undefined)
			throw new Error('Review is missing rating')
		return { review, date: review.date, rating: review.rating }
	})
	const firstReviewToReplay = completedReviews[0]
	// A partially populated seed is not safe to resume from, so fall back to a
	// full replay.
	let card =
		previousReview?.stabilityAfter === undefined
			? {
					...fsrs.createEmptyCard(
						firstReviewToReplay
							? isoToJsDate(firstReviewToReplay.date)
							: DateTime.fromMillis(0, {
									zone: 'utc',
								}).toJSDate(),
					),
					// Skip New so the first completed review enters the learning
					// schedule instead of immediately repeating the card.
					state: fsrs.State.Learning,
				}
			: reviewCardSrsStateToFsrsCard({
					stability: assertNonNull(
						previousReview.stabilityAfter,
						'Review is missing stabilityAfter',
					),
					difficulty: assertNonNull(
						previousReview.difficultyAfter,
						'Review is missing difficultyAfter',
					),
					state: previousReview.stateAfter ?? 'LEARNING',
					step: previousReview.stepAfter,
					dueDate: assertNonNull(
						previousReview.dueDateAfter,
						'Review is missing dueDateAfter',
					),
					lastReviewedAt: assertNonNull(
						previousReview.date,
						'Review is missing date',
					),
				})

	for (const { review, date, rating } of completedReviews) {
		const beforeState = fsrsCardToReviewCardSrsState(card)
		const { card: nextCard } = fsrsScheduler.next(
			card,
			isoToJsDate(date),
			reviewRatingToFsrsGrade(rating),
		)
		const afterState = fsrsCardToReviewCardSrsState(nextCard)

		reviewPatches.push({
			review,
			patch: {
				stabilityBefore: beforeState.stability,
				difficultyBefore: beforeState.difficulty,
				stateBefore: beforeState.state,
				stepBefore: beforeState.step,
				dueDateBefore: beforeState.dueDate,
				stabilityAfter: assertNonNull(
					afterState.stability,
					'SRS state is missing stability',
				),
				difficultyAfter: assertNonNull(
					afterState.difficulty,
					'SRS state is missing difficulty',
				),
				stateAfter: afterState.state,
				stepAfter: afterState.step,
				dueDateAfter: afterState.dueDate,
			},
		})
		card = nextCard
	}

	return { reviewPatches, cardState: fsrsCardToReviewCardSrsState(card) }
}

// TODO(4): Consider extracting these ts-fsrs boundary conversions into a
// dedicated adapter module.
/** Reconstruct a ts-fsrs card from the application's normalized SRS state. */
export function reviewCardSrsStateToFsrsCard(
	srsState: ReviewCardSrsState,
): fsrs.Card {
	const lastReviewedAt = assertNonNull(
		srsState.lastReviewedAt,
		'SRS state is missing lastReviewedAt',
	)
	const stability = assertNonNull(
		srsState.stability,
		'SRS state is missing stability',
	)
	const difficulty = assertNonNull(
		srsState.difficulty,
		'SRS state is missing difficulty',
	)

	const state = reviewCardStateToFsrsState(srsState.state)
	const jsReviewDate = isoToJsDate(lastReviewedAt)

	return {
		...fsrs.createEmptyCard(jsReviewDate),
		due: isoToJsDate(srsState.dueDate),
		stability,
		difficulty,
		state,
		learning_steps: state === fsrs.State.Review ? 0 : (srsState.step ?? 0),
		last_review: jsReviewDate,
	}
}

export function reviewCardStateToFsrsState(
	state: ReviewCard['state'],
): fsrs.State {
	switch (state) {
		case 'LEARNING':
			return fsrs.State.Learning
		case 'REVIEW':
			return fsrs.State.Review
		case 'RELEARNING':
			return fsrs.State.Relearning
	}
}

export function reviewRatingToFsrsGrade(
	rating: NonNullable<Review['rating']>,
): fsrs.Grade {
	switch (rating) {
		case 'miss':
			return fsrs.Rating.Again
		case 'hard':
			return fsrs.Rating.Hard
		case 'good':
			return fsrs.Rating.Good
		case 'easy':
			return fsrs.Rating.Easy
	}
}

function fsrsCardToReviewCardSrsState(card: fsrs.Card): ReviewCardSrsState {
	const hasBeenReviewed = card.last_review !== undefined

	return {
		stability: hasBeenReviewed ? card.stability : undefined,
		difficulty: hasBeenReviewed ? card.difficulty : undefined,
		state: fsrsStateToReviewCardState(card.state),
		step:
			card.state === fsrs.State.Review ? undefined : card.learning_steps,
		dueDate: jsDateToIso(card.due),
		lastReviewedAt:
			card.last_review === undefined
				? undefined
				: jsDateToIso(card.last_review),
	}
}

export function fsrsStateToReviewCardState(
	state: fsrs.State,
): ReviewCard['state'] {
	switch (state) {
		case fsrs.State.Learning:
			return 'LEARNING'
		case fsrs.State.Review:
			return 'REVIEW'
		case fsrs.State.Relearning:
			return 'RELEARNING'
		case fsrs.State.New:
			throw new Error('A new scheduler state cannot be persisted')
	}
}

export function isoToJsDate(value: string): Date {
	assertIsoDate(value)
	return DateTime.fromISO(value, { zone: 'utc' }).toJSDate()
}

export function jsDateToIso(value: Date): string {
	const date = DateTime.fromJSDate(value, { zone: 'utc' }).toISODate()
	if (date === null) throw new Error('Invalid native date')
	return date
}

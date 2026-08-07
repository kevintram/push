// Completed reviews are the source of truth for SRS state. Everything else in
// this file is derived from that history and can be rebuilt by replaying it.
// A review counts as completed exactly when it has a rating; its `date` is then
// the day it happened.
//
// Review dates are calendar dates, not timestamps. We represent them as UTC
// midnight while inside ts-fsrs so a replay never depends on the local timezone
// or wall clock of the machine running it.
import {
	type Card,
	createEmptyCard,
	fsrs,
	type Grade,
	Rating,
	State,
} from 'ts-fsrs'

import type { Doc } from '../../_generated/dataModel'
import type { MutationCtx } from '../../_generated/server'

// These are kept separate from ts-fsrs types so the scheduler remains an
// implementation detail of the model.
export type ReviewRating = 'miss' | 'hard' | 'good' | 'easy'

export type LearningState = 'LEARNING' | 'REVIEW' | 'RELEARNING'

export interface ReviewSrsSnapshot {
	date?: string
	rating?: ReviewRating
	stabilityAfter?: number
	difficultyAfter?: number
	stateAfter?: LearningState
	stepAfter?: number
	dueAfter?: string
}

export interface CompletedReviewSrsSnapshot extends ReviewSrsSnapshot {
	date: string
	rating: ReviewRating
}

export interface ReviewSrsPatch {
	stabilityBefore: number | undefined
	difficultyBefore: number | undefined
	stateBefore: LearningState
	stepBefore: number | undefined
	dueBefore: string
	stabilityAfter: number
	difficultyAfter: number
	stateAfter: LearningState
	stepAfter: number | undefined
	dueAfter: string
}

export interface ReviewCardSrsState {
	stability: number | undefined
	difficulty: number | undefined
	state: LearningState
	step: number | undefined
}

export interface ReplayReviewPatch<TReview> {
	review: TReview
	patch: ReviewSrsPatch
}

export interface ReplayResult<TReview> {
	reviewPatches: Array<ReplayReviewPatch<TReview>>
	cardState: ReviewCardSrsState
}

type CompletedReview = Doc<'reviews'> & { date: string; rating: ReviewRating }

const REQUEST_RETENTION = 0.85
const scheduler = fsrs({ request_retention: REQUEST_RETENTION })

// A new card's due date has no scheduling effect before its first review. The
// Unix epoch makes the no-history result deterministic for callers and tests.
const EMPTY_CARD_DATE = new Date(0)

/**
 * Replay the part of a card's history affected by a review change.
 *
 * This function is deliberately independent of Convex. Keeping the scheduling
 * loop pure makes historical edits deterministic and gives callers the exact
 * database patches to persist in their own transaction.
 */
export function replay<TReview extends CompletedReviewSrsSnapshot>({
	seedReview,
	reviews,
}: {
	seedReview?: ReviewSrsSnapshot
	reviews: ReadonlyArray<TReview>
}): ReplayResult<TReview> {
	const reviewPatches: Array<ReplayReviewPatch<TReview>> = []
	let card = initialCard(seedReview, reviews[0])

	for (const review of reviews) {
		const previousCard = card
		const { card: nextCard } = scheduler.next(
			previousCard,
			dateOnlyToUtc(review.date),
			ratingToGrade(review.rating),
		)

		reviewPatches.push({
			review,
			patch: reviewPatch(previousCard, nextCard),
		})
		card = nextCard
	}

	return { reviewPatches, cardState: cardState(card) }
}

/**
 * Recompute and persist a card's SRS state from the first affected day.
 *
 * Callers must verify ownership before entering this helper. All reads and
 * writes stay in the caller's mutation so a review edit and its derived state
 * commit atomically.
 */
export async function updateCardSrs(
	ctx: MutationCtx,
	card: Doc<'reviewCards'>,
	startingFrom: string,
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
	).filter(isCompleted)

	// Convex sorts `undefined` before strings. The empty-string lower bound
	// excludes undated reviews while preserving every valid date-only value.
	// Scheduled-but-unrated reviews still land in this range, so walk backwards
	// to the nearest rated one rather than taking the first row.
	let seedReview: CompletedReview | undefined
	for await (const candidate of ctx.db
		.query('reviews')
		.withIndex('by_reviewCardId_date', query =>
			query
				.eq('reviewCardId', card._id)
				.gte('date', '')
				.lt('date', startingFrom),
		)
		.order('desc')) {
		if (isCompleted(candidate)) {
			seedReview = candidate
			break
		}
	}

	const { reviewPatches, cardState } = replay({ seedReview, reviews })

	for (const { review, patch } of reviewPatches) {
		await ctx.db.patch('reviews', review._id, patch)
	}

	const lastReplayedReview = reviewPatches.at(-1)?.review
	await ctx.db.patch('reviewCards', card._id, {
		...cardState,
		lastReviewedAt:
			lastReplayedReview?.date ?? seedReview?.date ?? undefined,
	})
}

// Convert explicitly instead of relying on JavaScript's date-only parsing
// semantics. The round trip also rejects normalized dates such as February 30.
export function dateOnlyToUtc(value: string): Date {
	const date = new Date(`${value}T00:00:00.000Z`)

	if (Number.isNaN(date.getTime()) || utcToDateOnly(date) !== value) {
		throw new Error(`Invalid date-only value: ${value}`)
	}

	return date
}

export function utcToDateOnly(value: Date): string {
	return value.toISOString().slice(0, 10)
}

export function ratingToGrade(rating: ReviewRating): Grade {
	switch (rating) {
		case 'miss':
			return Rating.Again
		case 'hard':
			return Rating.Hard
		case 'good':
			return Rating.Good
		case 'easy':
			return Rating.Easy
	}
}

export function toSchedulerState(state: LearningState): State {
	switch (state) {
		case 'LEARNING':
			return State.Learning
		case 'REVIEW':
			return State.Review
		case 'RELEARNING':
			return State.Relearning
	}
}

export function fromSchedulerState(state: State): LearningState {
	switch (state) {
		case State.Learning:
			return 'LEARNING'
		case State.Review:
			return 'REVIEW'
		case State.Relearning:
			return 'RELEARNING'
		case State.New:
			throw new Error('A new scheduler state cannot be persisted')
	}
}

// We start directly in Learning because New is not a persisted application
// state. The first scheduler result will contain the actual memory state.
export function emptyCard(referenceDate: Date = EMPTY_CARD_DATE): Card {
	return {
		...createEmptyCard(referenceDate),
		state: State.Learning,
	}
}

export function cardFromReviewSnapshot(review: ReviewSrsSnapshot): Card {
	const date = requireSnapshotField(review.date, 'date')
	const stabilityAfter = requireSnapshotField(
		review.stabilityAfter,
		'stabilityAfter',
	)
	const difficultyAfter = requireSnapshotField(
		review.difficultyAfter,
		'difficultyAfter',
	)
	const state = toSchedulerState(review.stateAfter ?? 'LEARNING')
	const dateUtc = dateOnlyToUtc(date)

	return {
		...emptyCard(dateUtc),
		// `due` is not an FSRS-6 memory-state input for the next review. Using
		// the last review date avoids the nondeterministic wall clock used by the
		// Python reference implementation when reconstructing a replay seed.
		due: dateUtc,
		stability: stabilityAfter,
		difficulty: difficultyAfter,
		state,
		learning_steps: state === State.Review ? 0 : (review.stepAfter ?? 0),
		last_review: dateUtc,
	}
}

function initialCard(
	seedReview: ReviewSrsSnapshot | undefined,
	firstReview: CompletedReviewSrsSnapshot | undefined,
): Card {
	// A partially populated seed is not safe to resume from, so fall back to a
	// full replay.
	if (seedReview?.stabilityAfter === undefined) {
		return emptyCard(
			firstReview ? dateOnlyToUtc(firstReview.date) : EMPTY_CARD_DATE,
		)
	}

	return cardFromReviewSnapshot(seedReview)
}

function reviewPatch(before: Card, after: Card): ReviewSrsPatch {
	const beforeState = snapshotState(before)

	return {
		stabilityBefore: beforeState.stability,
		difficultyBefore: beforeState.difficulty,
		stateBefore: beforeState.state,
		stepBefore: beforeState.step,
		dueBefore: utcToDateOnly(before.due),
		stabilityAfter: after.stability,
		difficultyAfter: after.difficulty,
		stateAfter: fromSchedulerState(after.state),
		stepAfter: persistedStep(after),
		dueAfter: utcToDateOnly(after.due),
	}
}

function requireSnapshotField<T>(value: T | undefined, field: string): T {
	if (value === undefined) {
		throw new Error(`Seed review is missing ${field}`)
	}

	return value
}

function persistedStep(card: Card): number | undefined {
	return card.state === State.Review ? undefined : card.learning_steps
}

function cardState(card: Card): ReviewCardSrsState {
	const hasBeenReviewed = card.last_review !== undefined

	return {
		stability: hasBeenReviewed ? card.stability : undefined,
		difficulty: hasBeenReviewed ? card.difficulty : undefined,
		state: fromSchedulerState(card.state),
		step: hasBeenReviewed ? persistedStep(card) : undefined,
	}
}

function snapshotState(card: Card): ReviewCardSrsState {
	return { ...cardState(card), step: persistedStep(card) }
}

function isCompleted(review: Doc<'reviews'>): review is CompletedReview {
	return review.rating !== undefined && review.date !== undefined
}

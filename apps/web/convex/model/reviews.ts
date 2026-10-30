import { ConvexError } from 'convex/values'
import { DateTime } from 'luxon'

import { assertIsoDate } from '../../shared/date'
import { type Doc, type Id } from '../_generated/dataModel'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { Review, ReviewCreate, ReviewPatch } from '../validators/reviews'
import * as Cards from './cards'
import { updateCardSrs } from './srs/replay'

/** Project widened storage rows into the target Review API shape. */
export function toReview(review: Doc<'reviews'>): Review {
	if (review.cardId === undefined) {
		throw new Error('Review is missing card')
	}

	return {
		_id: review._id,
		_creationTime: review._creationTime,
		ownerId: review.ownerId,
		cardId: review.cardId,
		rating: review.rating,
		date: review.date,
		description: review.description,
		notes: review.notes,
		stabilityBefore: review.stabilityBefore,
		difficultyBefore: review.difficultyBefore,
		stateBefore: review.stateBefore,
		stepBefore: review.stepBefore,
		dueDateBefore: review.dueDateBefore,
		stabilityAfter: review.stabilityAfter,
		difficultyAfter: review.difficultyAfter,
		stateAfter: review.stateAfter,
		stepAfter: review.stepAfter,
		dueDateAfter: review.dueDateAfter,
	}
}

export async function requireUserOwns(
	ctx: QueryCtx,
	userId: string,
	reviewId: Id<'reviews'>,
): Promise<Doc<'reviews'>> {
	const review = await ctx.db.get('reviews', reviewId)

	if (!review || review.ownerId !== userId) {
		throw new ConvexError('Review not found')
	}

	return review
}

export async function listByCard(
	ctx: QueryCtx,
	userId: string,
	cardId: Id<'cards'>,
): Promise<Array<Review>> {
	await Cards.requireUserOwns(ctx, userId, cardId)

	const reviews = await ctx.db
		.query('reviews')
		.withIndex('by_cardId_ownerId', q =>
			q.eq('cardId', cardId).eq('ownerId', userId),
		)
		.order('desc')
		.collect()

	return reviews
		.sort((a, b) => {
			// nulls first
			if (a.date == undefined && b.date == undefined) return 0
			if (a.date == undefined) return -1
			if (b.date == undefined) return 1
			// date descending
			return b.date.localeCompare(a.date)
		})
		.map(toReview)
}

export async function get(
	ctx: QueryCtx,
	userId: string,
	reviewId: Id<'reviews'>,
): Promise<Review> {
	return toReview(await requireUserOwns(ctx, userId, reviewId))
}

export async function create(
	ctx: MutationCtx,
	userId: string,
	fields: ReviewCreate,
): Promise<Id<'reviews'>> {
	const card = await Cards.requireUserOwns(ctx, userId, fields.cardId)

	// A rating is the completion marker for a review, and every completion must
	// identify the calendar day on which it happened. The client supplies that
	// day because the backend does not know the user's timezone. In particular,
	// do not replace a missing date with the current UTC date here.
	const { date, rating } = fields
	if (date !== undefined) assertIsoDate(date)
	assertCompletedReviewIsValid(rating, date)

	const reviewId = await ctx.db.insert('reviews', {
		ownerId: userId,
		cardId: fields.cardId,
		rating,
		date,
		description: fields.description ?? '',
		notes: fields.notes ?? '',
	})

	// if this review is completed
	if (rating !== undefined && date !== undefined) {
		// run SRS on the corresponding card
		await updateCardSrs(ctx, card, date)
	}

	return reviewId
}

export async function update(
	ctx: MutationCtx,
	userId: string,
	reviewId: Id<'reviews'>,
	patch: ReviewPatch,
): Promise<void> {
	const review = await requireUserOwns(ctx, userId, reviewId)
	if (review.cardId === undefined) {
		throw new Error('Review is missing card')
	}
	const card = await Cards.requireUserOwns(ctx, userId, review.cardId)
	const wasCompleted = review.rating !== undefined
	const oldDate = review.date

	const { rating, date, ...fields } = patch
	if (date !== undefined && date !== null) assertIsoDate(date)

	const updates: Partial<Doc<'reviews'>> = { ...fields }
	let newRating = review.rating
	let newDate = review.date

	// Convex uses `undefined` to delete an optional document field, but we
	// use null so we do some translation.
	if (rating === null) {
		newRating = undefined
	} else if (rating !== undefined) {
		newRating = rating
	}

	if (date === null) {
		// A completion cannot exist without its day, so a caller reopening a
		// review has to clear the rating in the same patch.
		if (newRating !== undefined) {
			throw new Error('A completed review cannot have a null date')
		}
		newDate = undefined
	} else if (date !== undefined) {
		newDate = date
	}

	const completionChanged = rating !== undefined || date !== undefined
	if (!completionChanged) {
		// Patch now and early return to avoid SRS stuff.
		await ctx.db.patch('reviews', reviewId, updates)
		return
	}

	assertCompletedReviewIsValid(newRating, newDate)
	updates.rating = newRating
	updates.date = newDate

	const isCompleted = newRating !== undefined
	if (!isCompleted && wasCompleted) {
		// Clear review's SRS state
		Object.assign(updates, emptySrsSnapshot)
	}

	await ctx.db.patch('reviews', reviewId, updates)

	// Replay from the earliest position affected by this edit.
	const replayFrom = [
		wasCompleted ? oldDate : undefined, // don't take oldDate if it was just scheduled
		isCompleted ? newDate : undefined, // ^same for newDate
	]
		.filter(date => date !== undefined)
		.sort()[0]

	if (replayFrom !== undefined) {
		await updateCardSrs(ctx, card, replayFrom)
	}
}

export async function remove(
	ctx: MutationCtx,
	userId: string,
	reviewId: Id<'reviews'>,
): Promise<Review> {
	const review = await requireUserOwns(ctx, userId, reviewId)
	const card =
		review.cardId === undefined
			? null
			: await ctx.db.get('cards', review.cardId)
	await ctx.db.delete('reviews', reviewId)

	if (
		review.rating !== undefined &&
		review.date !== undefined &&
		card?.ownerId === userId
	) {
		await updateCardSrs(ctx, card, review.date)
	}

	return toReview(review)
}

const emptySrsSnapshot = {
	stabilityBefore: undefined,
	difficultyBefore: undefined,
	stateBefore: undefined,
	stepBefore: undefined,
	dueDateBefore: undefined,
	stabilityAfter: undefined,
	difficultyAfter: undefined,
	stateAfter: undefined,
	stepAfter: undefined,
	dueDateAfter: undefined,
} satisfies Partial<Doc<'reviews'>>

function assertCompletedReviewIsValid(
	rating: Doc<'reviews'>['rating'],
	date: Doc<'reviews'>['date'],
): void {
	if (rating === undefined) return
	if (date === undefined) {
		throw new Error('Completing a review requires an explicit date')
	}

	assertIsoDate(date)
	// A user's local calendar can be one day ahead of UTC. Accepting tomorrow
	// in UTC lets those clients submit their real local completion day while
	// still rejecting dates that cannot be "today" in any timezone.
	const latestCompletionDate = DateTime.utc().plus({ days: 1 }).toISODate()
	if (latestCompletionDate === null || date > latestCompletionDate) {
		throw new ConvexError("Can't have a completed review in the future")
	}
}

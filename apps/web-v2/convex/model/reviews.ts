import { DateTime } from 'luxon'

import { assertIsoDate } from '../../shared/date'
import { type Doc, type Id } from '../_generated/dataModel'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { ReviewCreate, ReviewPatch } from '../validators/reviews'
import * as ReviewCards from './reviewCards'
import { updateCardSrs } from './srs/replay'

export async function requireUserOwns(
	ctx: QueryCtx,
	reviewId: Id<'reviews'>,
	userId: string,
): Promise<Doc<'reviews'>> {
	const review = await ctx.db.get('reviews', reviewId)

	if (!review || review.ownerId !== userId) {
		throw Error('Review not found')
	}

	return review
}

export async function get(
	ctx: QueryCtx,
	reviewId: Id<'reviews'>,
	userId: string,
): Promise<Doc<'reviews'>> {
	return requireUserOwns(ctx, reviewId, userId)
}

export async function listByReviewCard(
	ctx: QueryCtx,
	reviewCardId: Id<'reviewCards'>,
	userId: string,
): Promise<Array<Doc<'reviews'>>> {
	await ReviewCards.requireUserOwns(ctx, reviewCardId, userId)

	return await ctx.db
		.query('reviews')
		.withIndex('by_reviewCardId_ownerId', q =>
			q.eq('reviewCardId', reviewCardId).eq('ownerId', userId),
		)
		.order('desc')
		.collect()
}

export async function create(
	ctx: MutationCtx,
	userId: string,
	fields: ReviewCreate,
): Promise<Id<'reviews'>> {
	const reviewCard = await ReviewCards.requireUserOwns(
		ctx,
		fields.reviewCardId,
		userId,
	)

	// A rating is the completion marker for a review, and every completion must
	// identify the calendar day on which it happened. The client supplies that
	// day because the backend does not know the user's timezone. In particular,
	// do not replace a missing date with the current UTC date here.
	const { date, rating } = fields
	if (date !== undefined) assertIsoDate(date)
	assertCompletedReviewIsValid(rating, date)

	const reviewId = await ctx.db.insert('reviews', {
		ownerId: userId,
		reviewCardId: fields.reviewCardId,
		rating,
		date,
		description: fields.description ?? '',
		notes: fields.notes ?? '',
	})

	// if this review is completed
	if (rating !== undefined && date !== undefined) {
		// run SRS on the corresponding review card
		await updateCardSrs(ctx, reviewCard, date)
	}

	return reviewId
}

export async function update(
	ctx: MutationCtx,
	userId: string,
	reviewId: Id<'reviews'>,
	patch: ReviewPatch,
): Promise<void> {
	const review = await requireUserOwns(ctx, reviewId, userId)
	const reviewCard = await ReviewCards.requireUserOwns(
		ctx,
		review.reviewCardId,
		userId,
	)
	const wasCompleted = review.rating !== undefined
	const oldDate = review.date

	// 1. Validate the `date` format.
	// 2. Require a `date` whenever `rating` is non-null.
	//
	// Passing both values together prevents a race condition. If `rating` were
	// passed independently, we would have to rely on server data that another
	// mutation could change concurrently.
	const { rating, date, ...fields } = patch
	if (date !== undefined && date !== null) assertIsoDate(date)
	if (rating !== undefined && rating !== null && date === null) {
		throw new Error('A completed review cannot have a null date')
	}

	const updates: Partial<Doc<'reviews'>> = { ...fields }
	let newRating = review.rating
	let newDate = review.date

	// Convex uses `undefined` to delete an optional document field, but we
	// use null so we do some translation.
	if (date === null) {
		// A completion cannot exist without its day, so clearing the day also
		// reopens the review even when the caller omits `rating`.
		newDate = undefined
		newRating = undefined
	} else if (date !== undefined) {
		newDate = date
	}

	if (rating === null) {
		// Clearing only the rating preserves the day. This turns the completion
		// back into a review scheduled for that same day.
		newRating = undefined
	} else if (rating !== undefined) {
		newRating = rating
		if (!wasCompleted) {
			// The first completion must carry the client's actual completion day.
			// A date already stored on an unrated row is only a scheduled day and
			// must not be mistaken for when the review was completed.
			if (date === undefined || date === null) {
				throw new Error('Completing a review requires an explicit date')
			}
			newDate = date
		}
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
		await updateCardSrs(ctx, reviewCard, replayFrom)
	}
}

export async function remove(
	ctx: MutationCtx,
	userId: string,
	reviewId: Id<'reviews'>,
): Promise<Doc<'reviews'>> {
	const review = await requireUserOwns(ctx, reviewId, userId)
	const reviewCard = await ctx.db.get('reviewCards', review.reviewCardId)
	await ctx.db.delete('reviews', reviewId)

	if (
		review.rating !== undefined &&
		review.date !== undefined &&
		reviewCard?.ownerId === userId
	) {
		await updateCardSrs(ctx, reviewCard, review.date)
	}

	return review
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
		throw new Error("Can't have a completed review in the future")
	}
}

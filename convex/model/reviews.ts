import { ConvexError } from 'convex/values'
import { DateTime } from 'luxon'

import { assertIsoDate } from '../../shared/date'
import { type Doc, type Id } from '../_generated/dataModel'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type {
	Review,
	ReviewCreate,
	ReviewCreated,
	ReviewPatch,
} from '../validators/reviews'
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
): Promise<ReviewCreated> {
	const card = await Cards.requireUserOwns(ctx, userId, fields.cardId)

	// Every review must identify the calendar day on which it happened. The
	// client supplies that day because the backend does not know the user's
	// timezone. In particular, do not default it to the current UTC date here.
	const { date, rating } = fields
	assertCompletionDateIsValid(date)

	const reviewId = await ctx.db.insert('reviews', {
		ownerId: userId,
		cardId: fields.cardId,
		rating,
		date,
		description: fields.description ?? '',
		notes: fields.notes ?? '',
	})

	await updateCardSrs(ctx, card, date)

	// Read back after SRS, which fills in both.
	return {
		review: await get(ctx, userId, reviewId),
		card: await Cards.get(ctx, userId, card._id),
	}
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

	const { rating, date } = patch
	if (rating === undefined && date === undefined) {
		// Patch now and early return to avoid SRS stuff.
		await ctx.db.patch('reviews', reviewId, patch)
		return
	}

	// TODO(1): drop once `migrations.deleteIncompleteReviews` has run and
	// `rating` and `date` are required in the schema.
	if (review.rating === undefined || review.date === undefined) {
		throw new ConvexError('Review is not completed')
	}
	if (date !== undefined) assertCompletionDateIsValid(date)

	await ctx.db.patch('reviews', reviewId, patch)

	// Replay from the earliest day this edit touches: the old day, since the
	// review may have moved later, or the new day, if it moved earlier.
	const replayFrom =
		date !== undefined && date < review.date ? date : review.date
	await updateCardSrs(ctx, card, replayFrom)
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

function assertCompletionDateIsValid(date: string): void {
	assertIsoDate(date)
	// A user's local calendar can be one day ahead of UTC. Accepting tomorrow
	// in UTC lets those clients submit their real local completion day while
	// still rejecting dates that cannot be "today" in any timezone.
	const latestCompletionDate = DateTime.utc().plus({ days: 1 }).toISODate()
	if (latestCompletionDate === null || date > latestCompletionDate) {
		throw new ConvexError("Can't have a completed review in the future")
	}
}

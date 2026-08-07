import { DateTime } from 'luxon'

import { type Doc, type Id } from '../_generated/dataModel'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { ReviewCreate, ReviewPatch } from '../validators/reviews'
import * as ReviewCards from './reviewCards'
import { updateCardSrs } from './srs/replay'

// TODO(2): This stamps the UTC calendar day. Convex has no access to the
// user's timezone, so this lands a day late for users rating in their local
// evening. Fix by passing the client's IANA zone as a mutation argument and
// switching to `DateTime.now().setZone(zone)`.
function todayInUtc(): string {
	return DateTime.utc().toISODate()!
}

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

	// A rating is what completes a review, and a completed review has to have
	// happened on some day, so rating without a date means "rated today".
	const { rating } = fields
	const date =
		fields.date ?? (rating !== undefined ? todayInUtc() : undefined)

	const reviewId = await ctx.db.insert('reviews', {
		ownerId: userId,
		reviewCardId: fields.reviewCardId,
		rating,
		date,
		description: fields.description ?? '',
		notes: fields.notes ?? '',
	})

	if (rating !== undefined && date !== undefined) {
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

	const { rating, date, ...fields } = patch
	const updates: Partial<Doc<'reviews'>> = { ...fields }
	let newRating = review.rating
	let newDate = review.date

	// Convex clears an optional document field when it is patched with
	// `undefined`; the public API uses `null` to request that operation.
	if (date === null) {
		// A completed review has to have happened on some day, so dropping the
		// date drops the completion with it.
		newDate = undefined
		newRating = undefined
	} else if (date !== undefined) {
		newDate = date
	}

	if (rating === null) {
		// Un-rating reopens the review but leaves its date alone, so the review
		// simply becomes scheduled for that day again.
		newRating = undefined
	} else if (rating !== undefined) {
		newRating = rating
		newDate ??= todayInUtc()
	}

	if (rating !== undefined || date !== undefined) {
		updates.rating = newRating
		updates.date = newDate
	}

	const isCompleted = newRating !== undefined

	if (!isCompleted && wasCompleted) {
		Object.assign(updates, emptySrsSnapshot)
	}

	await ctx.db.patch('reviews', reviewId, updates)

	// Replay from whichever day the card's history first changed.
	if (isCompleted && newDate !== undefined) {
		await updateCardSrs(ctx, reviewCard, newDate)
	} else if (wasCompleted && oldDate !== undefined) {
		await updateCardSrs(ctx, reviewCard, oldDate)
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
	dueBefore: undefined,
	stabilityAfter: undefined,
	difficultyAfter: undefined,
	stateAfter: undefined,
	stepAfter: undefined,
	dueAfter: undefined,
} satisfies Partial<Doc<'reviews'>>

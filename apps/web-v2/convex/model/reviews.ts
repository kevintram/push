import { type Infer } from 'convex/values'
import { DateTime } from 'luxon'

import { type Doc, type Id } from '../_generated/dataModel'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import { type reviewCreate, type reviewPatch } from '../validators/reviews'
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
	fields: Infer<typeof reviewCreate>,
): Promise<Id<'reviews'>> {
	const reviewCard = await ReviewCards.requireUserOwns(
		ctx,
		fields.reviewCardId,
		userId,
	)

	// the relationship between completedAt and rating
	// is that setting/clearing a rating will set/clear completedAt
	// ---
	// what the heck does setting/clearing completedAt mean?
	// completedAt vs rating is driven by the rating???
	// what's the difference between completedAt and scheduledAt
	// what if we just had date and completion status is based of the rating
	// what's the *point* of having completedAt and scheduledAt???

	const completedAt =
		fields.completedAt ??
		// if have rating, set `completedAt` to Today
		(fields.rating !== undefined ? todayInUtc() : undefined)
	const rating =
		completedAt === undefined // clear rating
			? undefined
			: (fields.rating ?? 'good') //

	const reviewId = await ctx.db.insert('reviews', {
		ownerId: userId,
		reviewCardId: fields.reviewCardId,
		rating,
		description: fields.description ?? '',
		notes: fields.notes ?? '',
		scheduledAt: fields.scheduledAt,
		completedAt,
	})

	if (completedAt !== undefined) {
		await updateCardSrs(ctx, reviewCard, completedAt)
	}

	return reviewId
}

export async function update(
	ctx: MutationCtx,
	userId: string,
	reviewId: Id<'reviews'>,
	patch: Infer<typeof reviewPatch>,
): Promise<void> {
	const review = await requireUserOwns(ctx, reviewId, userId)
	const reviewCard = await ReviewCards.requireUserOwns(
		ctx,
		review.reviewCardId,
		userId,
	)
	const oldCompletedAt = review.completedAt

	const { rating, scheduledAt, completedAt, ...fields } = patch
	const updates: Partial<Doc<'reviews'>> = { ...fields }
	let newRating = review.rating
	let newCompletedAt = review.completedAt

	if (rating === null || completedAt === null) {
		newRating = undefined
		newCompletedAt = undefined
	} else if (rating !== undefined) {
		// Ratings and completion are a pair: setting a rating completes the
		// review, while clearing it makes the review incomplete.
		newRating = rating
		newCompletedAt = completedAt ?? review.completedAt ?? todayInUtc()
	} else if (completedAt !== undefined) {
		newCompletedAt = completedAt
		newRating = review.rating ?? 'good'
	}

	if (rating !== undefined || completedAt !== undefined) {
		updates.rating = newRating
		updates.completedAt = newCompletedAt
	}

	if (scheduledAt !== undefined) {
		// Convex clears an optional document field when it is patched with
		// `undefined`; the public API uses `null` to request that operation.
		updates.scheduledAt = scheduledAt ?? undefined
	}

	if (newCompletedAt === undefined && oldCompletedAt !== undefined) {
		Object.assign(updates, emptySrsSnapshot)
	}

	await ctx.db.patch('reviews', reviewId, updates)

	if (newCompletedAt === undefined) {
		if (oldCompletedAt !== undefined) {
			await updateCardSrs(ctx, reviewCard, oldCompletedAt)
		}
	} else {
		await updateCardSrs(ctx, reviewCard, newCompletedAt)
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

	if (review.completedAt !== undefined && reviewCard?.ownerId === userId) {
		await updateCardSrs(ctx, reviewCard, review.completedAt)
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

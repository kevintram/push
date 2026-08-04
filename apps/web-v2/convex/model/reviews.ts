import { type Infer } from 'convex/values'
import { DateTime } from 'luxon'

import { type Doc, type Id } from '../_generated/dataModel'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import { type reviewCreate, type reviewPatch } from '../validators/reviews'
import * as ReviewCards from './reviewCards'

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
	await ReviewCards.requireUserOwns(ctx, fields.reviewCardId, userId)

	// TODO(2): A caller can supply a rating without completedAt, violating the
	// completion invariant enforced by `update`. Align create when its callers
	// need to create completed reviews.
	return await ctx.db.insert('reviews', {
		ownerId: userId,
		reviewCardId: fields.reviewCardId,
		rating: fields.rating,
		description: fields.description ?? '',
		notes: fields.notes ?? '',
		scheduledAt: fields.scheduledAt,
		completedAt: fields.completedAt,
	})
}

export async function update(
	ctx: MutationCtx,
	userId: string,
	reviewId: Id<'reviews'>,
	patch: Infer<typeof reviewPatch>,
): Promise<void> {
	const review = await requireUserOwns(ctx, reviewId, userId)

	const { rating, scheduledAt, completedAt, ...fields } = patch
	const updates: Partial<Doc<'reviews'>> = { ...fields }

	if (rating !== undefined) {
		// Ratings and completion are a pair: setting a rating completes the
		// review, while clearing it makes the review incomplete.
		updates.rating = rating ?? undefined
		updates.completedAt =
			rating === null
				? undefined
				: (completedAt ?? review.completedAt ?? todayInUtc())
	} else if (completedAt !== undefined) {
		updates.completedAt = completedAt ?? undefined

		if (completedAt === null) {
			// An incomplete review cannot retain a rating.
			updates.rating = undefined
		}
	}

	if (scheduledAt !== undefined) {
		// Convex clears an optional document field when it is patched with
		// `undefined`; the public API uses `null` to request that operation.
		updates.scheduledAt = scheduledAt ?? undefined
	}

	await ctx.db.patch('reviews', reviewId, updates)
}

export async function remove(
	ctx: MutationCtx,
	userId: string,
	reviewId: Id<'reviews'>,
): Promise<Doc<'reviews'>> {
	const review = await requireUserOwns(ctx, reviewId, userId)
	await ctx.db.delete('reviews', reviewId)
	return review
}

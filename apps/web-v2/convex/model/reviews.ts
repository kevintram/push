import { type Infer } from 'convex/values'

import { type Doc, type Id } from '../_generated/dataModel'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import { type reviewCreate } from '../validators/reviews'
import * as ReviewCards from './reviewCards'

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

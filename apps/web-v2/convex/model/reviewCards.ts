import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

/**
 * Deletes every review card belonging to `topicId`. Called while removing a
 * topic subtree so deleted topics do not leave unreachable cards behind.
 */
export async function deleteReviewCardsOf(
	ctx: MutationCtx,
	topicId: Id<'topics'>,
): Promise<void> {
	const reviewCards = ctx.db
		.query('reviewCards')
		.withIndex('by_topicId', q => q.eq('topicId', topicId))

	for await (const reviewCard of reviewCards) {
		await ctx.db.delete('reviewCards', reviewCard._id)
	}
}

export async function requireOwnedReviewCard(
	ctx: QueryCtx,
	reviewCardId: Id<'reviewCards'>,
	userId: string,
): Promise<Doc<'reviewCards'>> {
	const reviewCard = await ctx.db.get('reviewCards', reviewCardId)

	if (!reviewCard || reviewCard.ownerId !== userId) {
		throw new Error('Review card not found')
	}

	return reviewCard
}

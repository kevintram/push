import type { Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type {
	ReviewCard,
	ReviewCardCreate,
	ReviewCardPatch,
} from '../validators/reviewCards'
import * as Topics from './topics'

export async function requireUserOwns(
	ctx: QueryCtx,
	userId: string,
	reviewCardId: Id<'reviewCards'>,
): Promise<ReviewCard> {
	const reviewCard = await ctx.db.get('reviewCards', reviewCardId)

	if (!reviewCard || reviewCard.ownerId !== userId) {
		throw new Error('Review card not found')
	}

	return reviewCard
}

export async function listByTopic(
	ctx: QueryCtx,
	userId: string,
	topicId: Id<'topics'>,
): Promise<Array<ReviewCard>> {
	await Topics.requireUserOwns(ctx, userId, topicId)

	return await ctx.db
		.query('reviewCards')
		.withIndex('by_topicId_ownerId', q =>
			q.eq('topicId', topicId).eq('ownerId', userId),
		)
		.collect()
}

export async function get(
	ctx: QueryCtx,
	userId: string,
	reviewCardId: Id<'reviewCards'>,
): Promise<ReviewCard> {
	return await requireUserOwns(ctx, userId, reviewCardId)
}

export async function create(
	ctx: MutationCtx,
	userId: string,
	fields: ReviewCardCreate,
): Promise<Id<'reviewCards'>> {
	await Topics.requireUserOwns(ctx, userId, fields.topicId)

	return await ctx.db.insert('reviewCards', {
		ownerId: userId,
		topicId: fields.topicId,
		type: fields.type ?? 'flashcard',
		primaryText: fields.primaryText ?? '',
		secondaryText: fields.secondaryText ?? '',
		notes: fields.notes ?? '',
		...(fields.flaggedAt !== undefined && { flaggedAt: fields.flaggedAt }),
		state: 'LEARNING',
	})
}

export async function update(
	ctx: MutationCtx,
	userId: string,
	reviewCardId: Id<'reviewCards'>,
	patch: ReviewCardPatch,
): Promise<void> {
	await requireUserOwns(ctx, userId, reviewCardId)

	const { flaggedAt, ...fields } = patch

	await ctx.db.patch('reviewCards', reviewCardId, {
		...fields,
		// An omitted key leaves the flag alone. `null` clears it, which in
		// Convex means patching an explicit `undefined`.
		...(flaggedAt !== undefined && {
			flaggedAt: flaggedAt ?? undefined,
		}),
	})
}

export async function remove(
	ctx: MutationCtx,
	userId: string,
	reviewCardId: Id<'reviewCards'>,
): Promise<ReviewCard> {
	const reviewCard = await requireUserOwns(ctx, userId, reviewCardId)
	await deleteReviewCard(ctx, reviewCardId)
	// Returned so callers can navigate back to the card's topic.
	return reviewCard
}

/**
 * Deletes every review card belonging to `topicId`. Called while removing a
 * topic subtree so deleted topics do not leave unreachable cards behind.
 */
export async function deleteAllForTopic(
	ctx: MutationCtx,
	topicId: Id<'topics'>,
): Promise<void> {
	const reviewCards = ctx.db
		.query('reviewCards')
		.withIndex('by_topicId_ownerId', q => q.eq('topicId', topicId))

	for await (const reviewCard of reviewCards) {
		await deleteReviewCard(ctx, reviewCard._id)
	}
}

/** Deletes a review card and every review that depends on it. */
async function deleteReviewCard(
	ctx: MutationCtx,
	reviewCardId: Id<'reviewCards'>,
): Promise<void> {
	const reviews = ctx.db
		.query('reviews')
		.withIndex('by_reviewCardId_ownerId', q =>
			q.eq('reviewCardId', reviewCardId),
		)

	for await (const review of reviews) {
		await ctx.db.delete('reviews', review._id)
	}

	await ctx.db.delete('reviewCards', reviewCardId)
}

import type { Infer } from 'convex/values'

import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type {
	reviewCardCreate,
	reviewCardPatch,
} from '../validators/reviewCards'
import * as Topics from './topics'

export async function requireUserOwns(
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
		await ctx.db.delete('reviewCards', reviewCard._id)
	}
}

export async function listByTopic(
	ctx: QueryCtx,
	userId: string,
	topicId: Id<'topics'>,
): Promise<Array<Doc<'reviewCards'>>> {
	await Topics.requireUserOwns(ctx, topicId, userId)

	// A card always carries the owner of the topic it was created under, so
	// the topic check above is what authorizes this read. The `ownerId` half
	// of the index restates that invariant rather than trusting it, keeping
	// this consistent with `get`/`update`/`remove`, which check the card.
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
): Promise<Doc<'reviewCards'> | null> {
	const reviewCard = await ctx.db.get('reviewCards', reviewCardId)

	// Null rather than a throw: a card the caller cannot see is a 404 for
	// the route to render, not an error. Cards owned by someone else are
	// reported the same way so this does not leak their existence.
	if (!reviewCard || reviewCard.ownerId !== userId) {
		return null
	}

	return reviewCard
}

export async function create(
	ctx: MutationCtx,
	userId: string,
	fields: Infer<typeof reviewCardCreate>,
): Promise<Id<'reviewCards'>> {
	await Topics.requireUserOwns(ctx, fields.topicId, userId)

	return await ctx.db.insert('reviewCards', {
		topicId: fields.topicId,
		ownerId: userId,
		type: fields.type ?? 'flashcard',
		primaryText: fields.primaryText ?? '',
		secondaryText: fields.secondaryText ?? '',
		notes: fields.notes ?? '',
	})
}

export async function update(
	ctx: MutationCtx,
	userId: string,
	reviewCardId: Id<'reviewCards'>,
	patch: Infer<typeof reviewCardPatch>,
): Promise<void> {
	await requireUserOwns(ctx, reviewCardId, userId)

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
): Promise<Doc<'reviewCards'>> {
	const reviewCard = await requireUserOwns(ctx, reviewCardId, userId)

	await ctx.db.delete('reviewCards', reviewCardId)

	// Returned so callers can navigate back to the card's topic.
	return reviewCard
}

import type { Doc, Id } from '../_generated/dataModel'
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

export async function listNew(
	ctx: QueryCtx,
	userId: string,
): Promise<Array<ReviewCard>> {
	return await ctx.db
		.query('reviewCards')
		.withIndex('by_ownerId_stability', q =>
			q
				.eq('ownerId', userId)
				// Stability is the source of truth for whether a card has
				// entered SRS. This also leaves room for inherited cards to
				// carry stability without inheriting review timestamps.
				.eq('stability', undefined),
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

	const primaryText = fields.primaryText ?? ''
	const secondaryText = fields.secondaryText ?? ''
	const notes = fields.notes ?? ''

	return await ctx.db.insert('reviewCards', {
		ownerId: userId,
		topicId: fields.topicId,
		type: fields.type ?? 'flashcard',
		primaryText,
		secondaryText,
		notes,
		...(fields.flaggedAt !== undefined && { flaggedAt: fields.flaggedAt }),
		state: 'LEARNING',
		// Newline-separated so the last word of one field cannot fuse to the
		// first word of the next into a single bogus token. Nothing is
		// normalized: Convex tokenizes and case-folds while indexing.
		searchText: [primaryText, secondaryText, notes]
			.filter(Boolean)
			.join('\n'),
	})
}

export async function update(
	ctx: MutationCtx,
	userId: string,
	reviewCardId: Id<'reviewCards'>,
	patch: ReviewCardPatch,
): Promise<void> {
	const reviewCard = await requireUserOwns(ctx, userId, reviewCardId)

	const { flaggedAt, topicId, ...fields } = patch

	// A card can only move to another topic owned by the same user. Validate the
	// destination in this transaction so a failed check cannot orphan the card.
	if (topicId !== undefined) {
		await Topics.requireUserOwns(ctx, userId, topicId)
	}

	// Recomputed unconditionally from the merged doc: when the patch touches no
	// text field this rewrites the identical string, which is cheaper than a
	// second copy of the field list that could drift from the one below.
	const primaryText = fields.primaryText ?? reviewCard.primaryText
	const secondaryText = fields.secondaryText ?? reviewCard.secondaryText
	const notes = fields.notes ?? reviewCard.notes

	await ctx.db.patch('reviewCards', reviewCardId, {
		...fields,
		searchText: [primaryText, secondaryText, notes]
			.filter(Boolean)
			.join('\n'),
		...(topicId !== undefined && { topicId }),
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

export async function search(
	ctx: QueryCtx,
	userId: string,
	rawQuery: string,
): Promise<Array<Doc<'reviewCards'>>> {
	const query = rawQuery.trim()

	// Short-circuit rather than issue a search for the empty string, whose
	// behavior is unspecified and which can never produce a useful result.
	if (query === '') {
		return []
	}

	// TODO(2): paginate. This returns every match in one relevance-ordered
	// batch, which Convex caps at 1024 documents; past that, hits are dropped
	// with no signal to the caller. Switch to `.paginate()` and have the
	// dialog page as the user scrolls the expanded group.
	return await ctx.db
		.query('reviewCards')
		.withSearchIndex('by_searchText', q =>
			// The owner filter is the only thing keeping one user's documents
			// out of another's results. It is not an optimization.
			q.search('searchText', query).eq('ownerId', userId),
		)
		.collect()
}

import type { Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type {
	Card,
	CardCreate,
	CardPatch,
	CardSearchResult,
} from '../validators/cards'
import * as Collections from './collections'

export async function requireUserOwns(
	ctx: QueryCtx,
	userId: string,
	cardId: Id<'cards'>,
): Promise<Card> {
	const card = await ctx.db.get('cards', cardId)

	if (!card || card.ownerId !== userId) {
		throw new Error('Card not found')
	}

	return card
}

export async function listByCollection(
	ctx: QueryCtx,
	userId: string,
	collectionId: Id<'collections'>,
): Promise<Array<Card>> {
	await Collections.requireUserOwns(ctx, userId, collectionId)

	return await ctx.db
		.query('cards')
		.withIndex('by_collectionId_ownerId', q =>
			q.eq('collectionId', collectionId).eq('ownerId', userId),
		)
		.collect()
}

export async function listNew(
	ctx: QueryCtx,
	userId: string,
): Promise<Array<Card>> {
	return await ctx.db
		.query('cards')
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

export async function listFlagged(
	ctx: QueryCtx,
	userId: string,
): Promise<Array<Card>> {
	return await ctx.db
		.query('cards')
		.withIndex('by_ownerId_flaggedAt', q =>
			q.eq('ownerId', userId).gt('flaggedAt', undefined),
		)
		.order('desc')
		.collect()
}

export async function get(
	ctx: QueryCtx,
	userId: string,
	cardId: Id<'cards'>,
): Promise<Card> {
	return await requireUserOwns(ctx, userId, cardId)
}

export async function create(
	ctx: MutationCtx,
	userId: string,
	fields: CardCreate,
): Promise<Id<'cards'>> {
	await Collections.requireUserOwns(ctx, userId, fields.collectionId)

	const primaryText = fields.primaryText ?? ''
	const secondaryText = fields.secondaryText ?? ''
	const notes = fields.notes ?? ''

	return await ctx.db.insert('cards', {
		ownerId: userId,
		collectionId: fields.collectionId,
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
	cardId: Id<'cards'>,
	patch: CardPatch,
): Promise<void> {
	const card = await requireUserOwns(ctx, userId, cardId)

	const { flaggedAt, collectionId, ...fields } = patch

	// A card can only move to another collection owned by the same user. Validate the
	// destination in this transaction so a failed check cannot orphan the card.
	if (collectionId !== undefined) {
		await Collections.requireUserOwns(ctx, userId, collectionId)
	}

	// Recomputed unconditionally from the merged doc: when the patch touches no
	// text field this rewrites the identical string, which is cheaper than a
	// second copy of the field list that could drift from the one below.
	const primaryText = fields.primaryText ?? card.primaryText
	const secondaryText = fields.secondaryText ?? card.secondaryText
	const notes = fields.notes ?? card.notes

	await ctx.db.patch('cards', cardId, {
		...fields,
		searchText: [primaryText, secondaryText, notes]
			.filter(Boolean)
			.join('\n'),
		...(collectionId !== undefined && { collectionId }),
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
	cardId: Id<'cards'>,
): Promise<Card> {
	const card = await requireUserOwns(ctx, userId, cardId)
	await deleteCard(ctx, cardId)
	// Returned so callers can navigate back to the card's collection.
	return card
}

/**
 * Deletes every card belonging to `collectionId`. Called while removing a
 * collection subtree so deleted collections do not leave unreachable cards behind.
 */
export async function deleteAllForCollection(
	ctx: MutationCtx,
	collectionId: Id<'collections'>,
): Promise<void> {
	const cards = ctx.db
		.query('cards')
		.withIndex('by_collectionId_ownerId', q =>
			q.eq('collectionId', collectionId),
		)

	for await (const card of cards) {
		await deleteCard(ctx, card._id)
	}
}

/** Deletes a card and every review that depends on it. */
async function deleteCard(
	ctx: MutationCtx,
	cardId: Id<'cards'>,
): Promise<void> {
	const reviews = ctx.db
		.query('reviews')
		.withIndex('by_cardId_ownerId', q => q.eq('cardId', cardId))

	for await (const review of reviews) {
		await ctx.db.delete('reviews', review._id)
	}

	await ctx.db.delete('cards', cardId)
}

export async function search(
	ctx: QueryCtx,
	userId: string,
	rawQuery: string,
): Promise<Array<CardSearchResult>> {
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
	const hits = await ctx.db
		.query('cards')
		.withSearchIndex('by_searchText', q =>
			// The owner filter is the only thing keeping one user's documents
			// out of another's results. It is not an optimization.
			q.search('searchText', query).eq('ownerId', userId),
		)
		.collect()

	// Construct path for each card.
	// TODO(3): lazy loads the path from client?
	//
	// fetch collections that contain the hit cards
	const containingCollectionIds = [
		...new Set(hits.map(hit => hit.collectionId)),
	]
	const containingCollections = await Collections.getMany(
		ctx,
		userId,
		containingCollectionIds,
	)
	const containingCollectionsById = new Map(
		containingCollections.map(collection => [collection._id, collection]),
	)

	// fetch all the ancestor collections of containingCollections
	const ancestorCollectionIds = [
		...new Set(
			containingCollections.flatMap(collection => collection.path),
		),
	].filter(collectionId => !containingCollectionsById.has(collectionId))
	const ancestorCollections = await Collections.getMany(
		ctx,
		userId,
		ancestorCollectionIds,
	)
	const pathCollectionsById = new Map(
		[...containingCollections, ...ancestorCollections].map(collection => [
			collection._id,
			collection,
		]),
	)

	return hits.map(hit => {
		const containingCollection = containingCollectionsById.get(
			hit.collectionId,
		)
		// A missing containing collection (an orphaned or foreign-owned card) has no
		// location to show rather than a partially wrong one.
		const pathIds = containingCollection
			? [...containingCollection.path, containingCollection._id]
			: []

		return {
			_id: hit._id,
			primaryText: hit.primaryText,
			secondaryText: hit.secondaryText,
			notes: hit.notes,
			pathTitles: pathIds
				.map(
					collectionId =>
						pathCollectionsById.get(collectionId)?.title,
				)
				.filter((title): title is string => title !== undefined),
		}
	})
}

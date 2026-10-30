import { ConvexError } from 'convex/values'

import { backfillRanks, placeInLine, rankAfter } from '../../shared/ordering'
import type { Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type {
	Card,
	CardBatchPatch,
	CardCreate,
	CardMove,
	CardPatch,
	CardSearchResult,
} from '../validators/cards'
import type { Section } from '../validators/sections'
import * as Collections from './collections'
import * as Sections from './sections'

export async function requireUserOwns(
	ctx: QueryCtx,
	userId: string,
	cardId: Id<'cards'>,
): Promise<Card> {
	const card = await ctx.db.get('cards', cardId)

	if (!card || card.ownerId !== userId) {
		throw new ConvexError('Card not found')
	}

	return card
}

/**
 * The cards of one list: `sectionId`'s, or `collectionId`'s unsectioned cards
 * when it is undefined, in display order.
 */
function queryLine(
	ctx: QueryCtx,
	collectionId: Id<'collections'>,
	sectionId: Id<'sections'> | undefined,
) {
	return ctx.db
		.query('cards')
		.withIndex('by_collectionId_sectionId_rank', q =>
			q.eq('collectionId', collectionId).eq('sectionId', sectionId),
		)
}

/** The key for a card added to the bottom of a list. */
async function rankAtEnd(
	ctx: QueryCtx,
	collectionId: Id<'collections'>,
	sectionId: Id<'sections'> | undefined,
): Promise<string> {
	const last = await queryLine(ctx, collectionId, sectionId)
		.order('desc')
		.first()

	return rankAfter(last?.rank)
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
	if (fields.sectionId !== undefined) {
		await Sections.requireUserOwnsInCollection(
			ctx,
			userId,
			fields.sectionId,
			fields.collectionId,
		)
	}

	const primaryText = fields.primaryText ?? ''
	const secondaryText = fields.secondaryText ?? ''
	const notes = fields.notes ?? ''

	return await ctx.db.insert('cards', {
		ownerId: userId,
		collectionId: fields.collectionId,
		...(fields.sectionId !== undefined && { sectionId: fields.sectionId }),
		// New cards go to the bottom of their list.
		rank: await rankAtEnd(ctx, fields.collectionId, fields.sectionId),
		type: fields.type ?? 'practice',
		primaryText,
		secondaryText,
		notes,
		...(fields.flaggedAt !== undefined && { flaggedAt: fields.flaggedAt }),
		...(fields.retiredAt !== undefined && { retiredAt: fields.retiredAt }),
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

	const { flaggedAt, retiredAt, collectionId, sectionId, ...fields } = patch

	// A card can only move to another collection owned by the same user. Validate the
	// destination in this transaction so a failed check cannot orphan the card.
	if (collectionId !== undefined) {
		await Collections.requireUserOwns(ctx, userId, collectionId)
	}

	// A section must live in the card's collection, judged after any move in
	// this same patch.
	const destinationCollectionId = collectionId ?? card.collectionId
	if (sectionId !== undefined && sectionId !== null) {
		await Sections.requireUserOwnsInCollection(
			ctx,
			userId,
			sectionId,
			destinationCollectionId,
		)
	}
	// Moving to another collection without naming a section there leaves the
	// card unsectioned, since its old section stays behind.
	const sectionChanged =
		sectionId !== undefined || destinationCollectionId !== card.collectionId
	const destinationSectionId = sectionChanged
		? (sectionId ?? undefined)
		: card.sectionId
	// A card arriving in another list goes to its bottom.
	const listChanged =
		destinationCollectionId !== card.collectionId ||
		destinationSectionId !== card.sectionId

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
		// Clearing in Convex means patching an explicit `undefined`.
		...(sectionChanged && { sectionId: destinationSectionId }),
		...(listChanged && {
			rank: await rankAtEnd(
				ctx,
				destinationCollectionId,
				destinationSectionId,
			),
		}),
		// An omitted key leaves the flag alone. `null` clears it, which in
		// Convex means patching an explicit `undefined`.
		...(flaggedAt !== undefined && {
			flaggedAt: flaggedAt ?? undefined,
		}),
		// Same three-state shape as `flaggedAt` above.
		...(retiredAt !== undefined && {
			retiredAt: retiredAt ?? undefined,
		}),
	})
}

/**
 * Places `cardIds`, in that order, as a run in `sectionId`'s list, or their
 * collection's unsectioned cards when `sectionId` is null, right after
 * `afterId` or first when it is null. Writes each moving card, plus keys for
 * any cards in that list still unranked.
 */
export async function move(
	ctx: MutationCtx,
	userId: string,
	cardIds: ReadonlyArray<Id<'cards'>>,
	{ sectionId, afterId }: CardMove,
): Promise<void> {
	const cards = await Promise.all(
		cardIds.map(cardId => requireUserOwns(ctx, userId, cardId)),
	)
	const collectionId = cards[0]?.collectionId
	if (collectionId === undefined) return
	if (cards.some(card => card.collectionId !== collectionId)) {
		throw new Error('Cards can only move together within one collection')
	}
	if (sectionId !== null) {
		await Sections.requireUserOwnsInCollection(
			ctx,
			userId,
			sectionId,
			collectionId,
		)
	}

	const line = await queryLine(
		ctx,
		collectionId,
		sectionId ?? undefined,
	).collect()
	const { ranks, backfill } = placeInLine(
		// Cards share their collection's owner given well-formed data. The
		// check keeps a malformed foreign card from serving as an anchor.
		line.filter(row => row.ownerId === userId),
		cardIds,
		afterId,
	)

	for (const row of backfill) {
		await ctx.db.patch('cards', row._id, { rank: row.rank })
	}
	for (const row of ranks) {
		await ctx.db.patch('cards', row._id, {
			// Clearing in Convex means patching an explicit `undefined`.
			sectionId: sectionId ?? undefined,
			rank: row.rank,
		})
	}
}

/**
 * Ranks any of `collectionId`'s cards created before ordering existed, list by
 * list, keeping their order.
 */
export async function backfillForCollection(
	ctx: MutationCtx,
	collectionId: Id<'collections'>,
): Promise<void> {
	const cards = await ctx.db
		.query('cards')
		.withIndex('by_collectionId_sectionId_rank', q =>
			q.eq('collectionId', collectionId),
		)
		.collect()

	const lines = new Map<Id<'sections'> | undefined, Array<Card>>()
	for (const card of cards) {
		lines.set(card.sectionId, [...(lines.get(card.sectionId) ?? []), card])
	}
	for (const line of lines.values()) {
		for (const row of backfillRanks(line)) {
			await ctx.db.patch('cards', row._id, { rank: row.rank })
		}
	}
}

/** Applies the same patch to each card, as `update` would one by one. */
export async function updateMany(
	ctx: MutationCtx,
	userId: string,
	cardIds: ReadonlyArray<Id<'cards'>>,
	patch: CardBatchPatch,
): Promise<void> {
	for (const cardId of new Set(cardIds)) {
		await update(ctx, userId, cardId, patch)
	}
}

export async function remove(
	ctx: MutationCtx,
	userId: string,
	cardIds: ReadonlyArray<Id<'cards'>>,
): Promise<Array<Card>> {
	// A card named twice is deleted once.
	const cards = await Promise.all(
		[...new Set(cardIds)].map(cardId =>
			requireUserOwns(ctx, userId, cardId),
		),
	)
	// TODO(3): each card's reviews are deleted in this same mutation, so
	// deleting many cards with long histories can exceed the write limit.
	for (const card of cards) {
		await deleteCard(ctx, card._id)
	}
	// Returned so callers can navigate back to a removed card's collection.
	return cards
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

/**
 * Deletes every card in `section`. Called while removing a section, which
 * takes its cards with it.
 */
export async function deleteAllForSection(
	ctx: MutationCtx,
	section: Section,
): Promise<void> {
	const cards = queryLine(ctx, section.collectionId, section._id)

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

// removing and moving a mix of sections and cards in a separate file because
// it's cross domain

import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import type { Section } from '../validators/sections'
import * as Cards from './cards'
import * as Collections from './collections'
import * as Sections from './sections'

/** Sections and cards of one or more collections, acted on together. */
export type CollectionItems = {
	sectionIds: ReadonlyArray<Id<'sections'>>
	cardIds: ReadonlyArray<Id<'cards'>>
}

/**
 * Deletes the sections, every card in them, the other cards, and every review
 * of those cards.
 */
export async function remove(
	ctx: MutationCtx,
	userId: string,
	items: CollectionItems,
): Promise<void> {
	const { sections, looseCardIds } = await resolve(ctx, userId, items)

	await Cards.remove(ctx, userId, looseCardIds)
	for (const section of sections) {
		await Cards.deleteAllForSection(ctx, section)
		await ctx.db.delete('sections', section._id)
	}
}

/**
 * Moves the sections, with their cards, to the bottom of `collectionId`'s
 * sections, and the other cards to the bottom of its unsectioned cards, each
 * in the order given. Sections keep their cards, so the cards' order carries
 * over. Items already in `collectionId` stay where they are.
 */
export async function moveToCollection(
	ctx: MutationCtx,
	userId: string,
	items: CollectionItems,
	collectionId: Id<'collections'>,
): Promise<void> {
	await Collections.requireUserOwns(ctx, userId, collectionId)
	const { sections, looseCardIds } = await resolve(ctx, userId, items)

	// TODO(3): one mutation can write only so many documents, so moving
	// sections with thousands of cards fails.
	for (const section of sections) {
		if (section.collectionId === collectionId) continue

		await ctx.db.patch('sections', section._id, {
			collectionId,
			rank: await Sections.rankAtEnd(ctx, collectionId),
		})
		// Collected first because each patch moves the card out of the range.
		const cards = await ctx.db
			.query('cards')
			.withIndex('by_collectionId_sectionId_rank', q =>
				q
					.eq('collectionId', section.collectionId)
					.eq('sectionId', section._id),
			)
			.collect()
		for (const card of cards) {
			await ctx.db.patch('cards', card._id, { collectionId })
		}
	}

	await Cards.updateMany(ctx, userId, looseCardIds, { collectionId })
}

/**
 * Checks that the user owns every item, and leaves out the cards inside one of
 * the sections, which go wherever their section goes.
 */
async function resolve(
	ctx: MutationCtx,
	userId: string,
	{ sectionIds, cardIds }: CollectionItems,
): Promise<{
	sections: Array<Section>
	looseCardIds: Array<Id<'cards'>>
}> {
	const sections = await Promise.all(
		[...new Set(sectionIds)].map(sectionId =>
			Sections.requireUserOwns(ctx, userId, sectionId),
		),
	)
	const cards = await Promise.all(
		[...new Set(cardIds)].map(cardId =>
			Cards.requireUserOwns(ctx, userId, cardId),
		),
	)
	const ids = new Set(sectionIds)

	return {
		sections,
		looseCardIds: cards
			.filter(card => !card.sectionId || !ids.has(card.sectionId))
			.map(card => card._id),
	}
}

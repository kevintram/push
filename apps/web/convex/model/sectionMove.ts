// moving a section in a separate file because it's cross domain

import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import * as Collections from './collections'
import * as Sections from './sections'

/**
 * Moves `sectionId` and its cards to the bottom of `collectionId`'s sections.
 * The cards keep their section, so their order carries over.
 */
export async function moveToCollection(
	ctx: MutationCtx,
	userId: string,
	sectionId: Id<'sections'>,
	collectionId: Id<'collections'>,
): Promise<void> {
	const section = await Sections.requireUserOwns(ctx, userId, sectionId)
	await Collections.requireUserOwns(ctx, userId, collectionId)
	if (section.collectionId === collectionId) return

	// TODO(3): one mutation can write only so many documents, so moving a
	// section with thousands of cards fails.
	await ctx.db.patch('sections', sectionId, {
		collectionId,
		rank: await Sections.rankAtEnd(ctx, collectionId),
	})

	// Collected first because each patch moves the card out of the range.
	const cards = await ctx.db
		.query('cards')
		.withIndex('by_collectionId_sectionId_rank', q =>
			q
				.eq('collectionId', section.collectionId)
				.eq('sectionId', sectionId),
		)
		.collect()

	for (const card of cards) {
		await ctx.db.patch('cards', card._id, { collectionId })
	}
}

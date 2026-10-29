// section conversion in a separate file because it's cross domain

import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import * as Collections from './collections'
import * as Sections from './sections'

/**
 * Replaces `sectionId` with a subcollection of its collection that has the
 * section's title and holds its cards, in order, as unsectioned cards.
 */
export async function convertToCollection(
	ctx: MutationCtx,
	userId: string,
	sectionId: Id<'sections'>,
): Promise<Id<'collections'>> {
	const section = await Sections.requireUserOwns(ctx, userId, sectionId)

	// TODO(3): one mutation can write only so many documents, so converting a
	// section with thousands of cards fails.
	const collectionId = await Collections.create(ctx, userId, {
		parentId: section.collectionId,
		title: section.title,
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

	// The new collection has no cards yet, so the section's keys carry over
	// as its unsectioned cards' order.
	for (const card of cards) {
		await ctx.db.patch('cards', card._id, {
			collectionId,
			sectionId: undefined,
		})
	}

	await ctx.db.delete('sections', sectionId)

	return collectionId
}

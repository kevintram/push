import { v } from 'convex/values'

import { mutation } from './_generated/server'
import { requireIdentity } from './model/auth'
import * as CollectionItems from './model/collectionItems'
import { cardPlacement } from './validators/cards'
import { sectionPlacement } from './validators/sections'

// Sections and cards acted on together, such as a selection on the collection
// page. A card inside one of the sections goes wherever its section goes.
const collectionItems = {
	sectionIds: v.array(v.id('sections')),
	cardIds: v.array(v.id('cards')),
}

export const moveToCollection = mutation({
	args: {
		...collectionItems,
		collectionId: v.id('collections'),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		const { collectionId, ...items } = args

		await CollectionItems.moveToCollection(ctx, userId, items, collectionId)
	},
})

// Moves each section, with its cards, and each card to its own exact place, as
// when undoing `moveToCollection` with where the items were beforehand.
export const moveToPlacements = mutation({
	args: {
		sections: v.array(sectionPlacement),
		cards: v.array(cardPlacement),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		await CollectionItems.moveToPlacements(ctx, userId, args)
	},
})

/* AKA delete (we don't use `delete` because it's a reserved JS keyword) */
export const remove = mutation({
	args: collectionItems,
	returns: v.null(),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		await CollectionItems.remove(ctx, userId, args)
	},
})

import { v } from 'convex/values'

import { mutation } from './_generated/server'
import { requireIdentity } from './model/auth'
import * as CollectionItems from './model/collectionItems'

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

/* AKA delete (we don't use `delete` because it's a reserved JS keyword) */
export const remove = mutation({
	args: collectionItems,
	returns: v.null(),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		await CollectionItems.remove(ctx, userId, args)
	},
})

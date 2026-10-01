import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { requireIdentity } from './model/auth'
import * as CollectionRemoval from './model/collectionRemoval'
import * as Collections from './model/collections'
import {
	collectionCreate,
	collectionDetail,
	collectionPatch,
	collectionRead,
	collectionSearchResult,
} from './validators/collections'

export const list = query({
	args: {},
	returns: v.array(collectionRead),
	handler: async ctx => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Collections.list(ctx, userId)
	},
})

export const get = query({
	args: {
		collectionId: v.id('collections'),
		// Required rather than defaulted: an omitted arg and an explicit
		// `false` are distinct Convex cache keys for identical data.
		expandPath: v.boolean(),
	},
	returns: collectionDetail,
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Collections.get(
			ctx,
			userId,
			args.collectionId,
			args.expandPath,
		)
	},
})

export const search = query({
	args: {
		query: v.string(),
	},
	returns: v.array(collectionSearchResult),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Collections.search(ctx, userId, args.query)
	},
})

export const create = mutation({
	args: collectionCreate.fields,
	returns: v.id('collections'),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Collections.create(ctx, userId, args)
	},
})

export const update = mutation({
	args: {
		collectionId: v.id('collections'),
		...collectionPatch.fields,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		const { collectionId, ...patch } = args

		await Collections.update(ctx, userId, collectionId, patch)
	},
})

/* AKA delete (we don't use `delete` because it's a reserved JS keyword) */
export const remove = mutation({
	args: {
		collectionId: v.id('collections'),
	},
	returns: collectionRead,
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await CollectionRemoval.remove(ctx, userId, args.collectionId)
	},
})

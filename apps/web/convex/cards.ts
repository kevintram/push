import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { requireIdentity } from './model/auth'
import * as Cards from './model/cards'
import {
	cardBatchPatch,
	cardCreate,
	cardMove,
	cardPatch,
	cardRead,
	cardSearchResult,
} from './validators/cards'

export const listByCollection = query({
	args: {
		collectionId: v.id('collections'),
	},
	returns: v.array(cardRead),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Cards.listByCollection(ctx, userId, args.collectionId)
	},
})

export const listFlagged = query({
	args: {},
	returns: v.array(cardRead),
	handler: async ctx => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Cards.listFlagged(ctx, userId)
	},
})

export const get = query({
	args: {
		cardId: v.id('cards'),
	},
	returns: cardRead,
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Cards.get(ctx, userId, args.cardId)
	},
})

export const search = query({
	args: {
		query: v.string(),
	},
	returns: v.array(cardSearchResult),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Cards.search(ctx, userId, args.query)
	},
})

export const create = mutation({
	args: cardCreate.fields,
	returns: v.id('cards'),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Cards.create(ctx, userId, args)
	},
})

export const update = mutation({
	args: {
		cardId: v.id('cards'),
		...cardPatch.fields,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		const { cardId, ...patch } = args

		await Cards.update(ctx, userId, cardId, patch)
	},
})

export const updateMany = mutation({
	args: {
		cardIds: v.array(v.id('cards')),
		...cardBatchPatch.fields,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		const { cardIds, ...patch } = args

		await Cards.updateMany(ctx, userId, cardIds, patch)
	},
})

export const move = mutation({
	args: {
		cardIds: v.array(v.id('cards')),
		...cardMove.fields,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		const { cardIds, ...placement } = args

		await Cards.move(ctx, userId, cardIds, placement)
	},
})

/* AKA delete (we don't use `delete` because it's a reserved JS keyword) */
export const remove = mutation({
	args: {
		cardIds: v.array(v.id('cards')),
	},
	returns: v.array(cardRead),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Cards.remove(ctx, userId, args.cardIds)
	},
})

import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { requireIdentity } from './model/auth'
import * as ReviewCards from './model/reviewCards'
import {
	reviewCardCreate,
	reviewCardPatch,
	reviewCardRead,
	reviewCardSearchResult,
} from './validators/reviewCards'

export const listByTopic = query({
	args: {
		topicId: v.id('topics'),
	},
	returns: v.array(reviewCardRead),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await ReviewCards.listByTopic(ctx, userId, args.topicId)
	},
})

export const listNew = query({
	args: {},
	returns: v.array(reviewCardRead),
	handler: async ctx => {
		const { subject: userId } = await requireIdentity(ctx)

		return await ReviewCards.listNew(ctx, userId)
	},
})

export const listFlagged = query({
	args: {},
	returns: v.array(reviewCardRead),
	handler: async ctx => {
		const { subject: userId } = await requireIdentity(ctx)

		return await ReviewCards.listFlagged(ctx, userId)
	},
})

export const get = query({
	args: {
		reviewCardId: v.id('reviewCards'),
	},
	returns: reviewCardRead,
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await ReviewCards.get(ctx, userId, args.reviewCardId)
	},
})

export const search = query({
	args: {
		query: v.string(),
	},
	returns: v.array(reviewCardSearchResult),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await ReviewCards.search(ctx, userId, args.query)
	},
})

export const create = mutation({
	args: reviewCardCreate.fields,
	returns: v.id('reviewCards'),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await ReviewCards.create(ctx, userId, args)
	},
})

export const update = mutation({
	args: {
		reviewCardId: v.id('reviewCards'),
		...reviewCardPatch.fields,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		const { reviewCardId, ...patch } = args

		await ReviewCards.update(ctx, userId, reviewCardId, patch)
	},
})

/* AKA delete (we don't use `delete` because it's a reserved JS keyword) */
export const remove = mutation({
	args: {
		reviewCardId: v.id('reviewCards'),
	},
	returns: reviewCardRead,
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await ReviewCards.remove(ctx, userId, args.reviewCardId)
	},
})

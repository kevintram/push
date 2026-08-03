import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { requireIdentity } from './model/auth'
import * as ReviewCards from './model/reviewCards'
import {
	reviewCardCreate,
	reviewCardPatch,
	reviewCardRead,
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

export const get = query({
	args: {
		reviewCardId: v.id('reviewCards'),
	},
	returns: v.union(reviewCardRead, v.null()),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await ReviewCards.get(ctx, userId, args.reviewCardId)
	},
})

export const create = mutation({
	args: {
		topicId: v.id('topics'),
		...reviewCardCreate.fields,
	},
	returns: v.id('reviewCards'),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		const { topicId, ...fields } = args

		return await ReviewCards.create(ctx, userId, topicId, fields)
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

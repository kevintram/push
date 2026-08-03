import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { requireIdentity } from './model/auth'
import * as TopicRemoval from './model/topicRemoval'
import * as Topics from './model/topics'
import { topicCreate, topicPatch, topicRead } from './validators/topics'

export const list = query({
	args: {},
	returns: v.array(topicRead),
	handler: async ctx => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Topics.list(ctx, userId)
	},
})

export const get = query({
	args: {
		topicId: v.id('topics'),
	},
	returns: topicRead,
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Topics.get(ctx, userId, args.topicId)
	},
})

export const create = mutation({
	args: topicCreate.fields,
	returns: v.id('topics'),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Topics.create(ctx, userId, args)
	},
})

export const update = mutation({
	args: {
		topicId: v.id('topics'),
		...topicPatch.fields,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		const { topicId, ...patch } = args

		await Topics.update(ctx, userId, topicId, patch)
	},
})

/* AKA delete (we don't use `delete` because it's a reserved JS keyword) */
export const remove = mutation({
	args: {
		topicId: v.id('topics'),
	},
	returns: topicRead,
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await TopicRemoval.remove(ctx, userId, args.topicId)
	},
})

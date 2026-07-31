import { v } from 'convex/values'

import { mutation, query } from './_generated/server'

export const list = query({
	args: {},
	handler: async ctx => await ctx.db.query('topics').collect(),
})

export const get = query({
	args: {
		topicId: v.id('topics'),
	},
	handler: async (ctx, args) => await ctx.db.get('topics', args.topicId),
})

export const create = mutation({
	args: {
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		parentId: v.optional(v.id('topics')),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('topics', {
			title: args.title ?? '',
			description: args.description ?? '',
			parentId: args.parentId,
		})
	},
})

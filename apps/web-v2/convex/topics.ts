import { v } from 'convex/values'

import { query } from './_generated/server'

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

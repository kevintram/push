import { v } from 'convex/values'

import type { Id } from './_generated/dataModel'
import { mutation, type MutationCtx, query } from './_generated/server'

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
	handler: async (ctx, args) =>
		await ctx.db.insert('topics', {
			title: args.title ?? '',
			description: args.description ?? '',
			parentId: args.parentId,
		}),
})

/* AKA delete (we don't use `delete` because it's a reserved JS keyword) */
export const remove = mutation({
	args: {
		topicId: v.id('topics'),
	},
	handler: async (ctx, args) => {
		const topic = await ctx.db.get('topics', args.topicId)

		if (!topic) {
			throw new Error('Topic not found!')
		}

		await deleteChildrenOf(ctx, args.topicId)
		return topic
	},
})

async function deleteChildrenOf(
	ctx: MutationCtx,
	topicId: Id<'topics'>,
): Promise<void> {
	const children = ctx.db
		.query('topics')
		.withIndex('by_parentId', q => q.eq('parentId', topicId))

	for await (const child of children) {
		await deleteChildrenOf(ctx, child._id)
	}

	await ctx.db.delete('topics', topicId)
}

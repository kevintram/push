import { v } from 'convex/values'

import type { Doc, Id } from './_generated/dataModel'
import { mutation, type MutationCtx, query } from './_generated/server'
import { requireIdentity } from './auth'

export const list = query({
	args: {},
	handler: async ctx => {
		const { subject: userId } = await requireIdentity(ctx)

		return await ctx.db
			.query('topics')
			.withIndex('by_ownerId', q => q.eq('ownerId', userId))
			.collect()
	},
})

export const get = query({
	args: {
		topicId: v.id('topics'),
	},
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		const topic = await ctx.db.get('topics', args.topicId)

		if (!topic || topic.ownerId !== userId) {
			throw new Error('Topic not found')
		}

		return topic
	},
})

export const create = mutation({
	args: {
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		parentId: v.optional(v.id('topics')),
	},
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		if (args.parentId) {
			const parent = await ctx.db.get('topics', args.parentId)

			if (!parent || parent.ownerId !== userId) {
				throw new Error('Parent topic not found')
			}
		}

		return await ctx.db.insert('topics', {
			title: args.title ?? '',
			description: args.description ?? '',
			parentId: args.parentId,
			ownerId: userId,
		})
	},
})

export const update = mutation({
	args: {
		topicId: v.id('topics'),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		parentId: v.optional(
			v.union(v.id('topics'), v.null()), // callers pass null to unset
		),
	},
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		const topic = await ctx.db.get('topics', args.topicId)
		if (!topic || topic.ownerId !== userId) {
			throw new Error('Topic not found')
		}

		if (args.parentId === args.topicId) {
			throw new Error('A topic cannot be its own parent')
		}

		if (args.parentId) {
			const parent = await ctx.db.get('topics', args.parentId)

			if (!parent || parent.ownerId !== userId) {
				throw new Error('Parent topic not found')
			}
		}

		const { topicId, ...fields } = args

		if (fields.parentId === null) {
			// In Convex, pass explicit `undefined` to unset a field.
			fields.parentId = undefined
		}

		await ctx.db.patch('topics', topicId, fields as Partial<Doc<'topics'>>)
	},
})

/* AKA delete (we don't use `delete` because it's a reserved JS keyword) */
export const remove = mutation({
	args: {
		topicId: v.id('topics'),
	},
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		const topic = await ctx.db.get('topics', args.topicId)

		if (!topic || topic.ownerId !== userId) {
			throw new Error('Topic not found')
		}

		await deleteChildrenOf(ctx, args.topicId, userId, new Set())

		return topic
	},
})

async function deleteChildrenOf(
	ctx: MutationCtx,
	topicId: Id<'topics'>,
	userId: string,
	visitedTopicIds: Set<Id<'topics'>>,
): Promise<void> {
	if (visitedTopicIds.has(topicId)) {
		return
	}

	visitedTopicIds.add(topicId)

	const children = ctx.db
		.query('topics')
		.withIndex('by_parentId', q => q.eq('parentId', topicId))

	for await (const child of children) {
		if (child.ownerId !== userId) {
			throw new Error('Unable to delete children')
		}

		await deleteChildrenOf(ctx, child._id, userId, visitedTopicIds)
	}

	await ctx.db.delete('topics', topicId)
}

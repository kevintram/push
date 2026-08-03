import { v } from 'convex/values'

import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './auth'
import {
	deleteChildrenOf,
	requireOwnedTopic,
	validateParent,
} from './model/topics'

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

		return await requireOwnedTopic(ctx, args.topicId, userId)
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
			await validateParent(ctx, args.parentId, userId)
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

		await requireOwnedTopic(ctx, args.topicId, userId)

		if (args.parentId === args.topicId) {
			throw new Error('A topic cannot be its own parent')
		}

		if (args.parentId) {
			await validateParent(ctx, args.parentId, userId, args.topicId)
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
		const topic = await requireOwnedTopic(ctx, args.topicId, userId)

		await deleteChildrenOf(ctx, args.topicId, userId, new Set())

		return topic
	},
})

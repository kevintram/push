import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
	topics: defineTable({
		title: v.string(),
		description: v.string(),
		parentId: v.optional(v.id('topics')),
		ownerId: v.string(),
	})
		.index('by_parentId', ['parentId'])
		.index('by_ownerId', ['ownerId']),
})

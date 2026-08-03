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

	/*
	 * Only the fields a user authors directly. The SRS state the FastAPI
	 * service keeps on `review_cards` (stability, difficulty, learning state,
	 * step, last review) is deliberately absent until the scheduler itself
	 * moves to Convex.
	 */
	reviewCards: defineTable({
		topicId: v.id('topics'),
		ownerId: v.string(),
		type: v.union(v.literal('practice'), v.literal('flashcard')),
		primaryText: v.string(),
		secondaryText: v.string(),
		notes: v.string(),
		flaggedAt: v.optional(v.number()), // epoch ms; absent when unflagged
	})
		.index('by_topicId', ['topicId'])
		.index('by_ownerId', ['ownerId']),
})

import { defineSchema, defineTable } from 'convex/server'

import { reviewCardBase } from './validators/reviewCards'
import { reviewBase } from './validators/reviews'
import { topicBase } from './validators/topics'

export default defineSchema({
	topics: defineTable(topicBase)
		.index('by_parentId', ['parentId'])
		.index('by_ownerId', ['ownerId']),

	// `by_topicId_ownerId` also serves lookups by `topicId` alone, since an
	// index can be queried on any prefix of its fields.
	reviewCards: defineTable(reviewCardBase)
		.index('by_topicId_ownerId', ['topicId', 'ownerId'])
		.index('by_ownerId', ['ownerId']),

	reviews: defineTable(reviewBase)
		.index('by_reviewCardId_ownerId', ['reviewCardId', 'ownerId'])
		.index('by_reviewCardId_completedAt', ['reviewCardId', 'completedAt']),
})

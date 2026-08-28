import { defineSchema, defineTable } from 'convex/server'

import { reviewCardBase } from './validators/reviewCards'
import { reviewBase } from './validators/reviews'
import { topicBase } from './validators/topics'

export default defineSchema({
	topics: defineTable(topicBase)
		.index('by_parentId', ['parentId'])
		.index('by_ownerId', ['ownerId'])
		.searchIndex('by_searchText', {
			searchField: 'searchText',
			filterFields: ['ownerId'],
		}),

	// `by_topicId_ownerId` also serves lookups by `topicId` alone, since an
	// index can be queried on any prefix of its fields.
	reviewCards: defineTable(reviewCardBase)
		.index('by_topicId_ownerId', ['topicId', 'ownerId'])
		.index('by_ownerId_dueDate', ['ownerId', 'dueDate'])
		.index('by_ownerId', ['ownerId'])
		.index('by_ownerId_stability', ['ownerId', 'stability'])
		.index('by_ownerId_flaggedAt', ['ownerId', 'flaggedAt'])
		.searchIndex('by_searchText', {
			searchField: 'searchText',
			filterFields: ['ownerId'],
		}),

	// `by_reviewCardId_date` backs SRS replay, which needs a card's reviews in
	// date order. Rated and unrated reviews share the index; replay filters the
	// unrated ones out in memory, which is bounded by a single card's history.
	reviews: defineTable(reviewBase)
		.index('by_reviewCardId_ownerId', ['reviewCardId', 'ownerId'])
		.index('by_reviewCardId_date', ['reviewCardId', 'date'])
		.index('by_ownerId_rating_date', ['ownerId', 'rating', 'date']),
})

import { defineSchema, defineTable } from 'convex/server'

import { cardBase } from './validators/cards'
import { collectionBase } from './validators/collections'
import { reviewBase } from './validators/reviews'

export default defineSchema({
	collections: defineTable(collectionBase)
		.index('by_parentId', ['parentId'])
		.index('by_ownerId', ['ownerId'])
		.searchIndex('by_searchText', {
			searchField: 'searchText',
			filterFields: ['ownerId'],
		}),

	cards: defineTable(cardBase)
		.index('by_collectionId_ownerId', ['collectionId', 'ownerId'])
		// `retiredAt` is an equality prefix so the due queue can exclude
		// retired cards in the index rather than by post-filter, while
		// `dueDate` stays available as the range suffix.
		.index('by_ownerId_retiredAt_dueDate', [
			'ownerId',
			'retiredAt',
			'dueDate',
		])
		.index('by_ownerId', ['ownerId'])
		.index('by_ownerId_flaggedAt', ['ownerId', 'flaggedAt'])
		.searchIndex('by_searchText', {
			searchField: 'searchText',
			filterFields: ['ownerId'],
		}),

	reviews: defineTable(reviewBase)
		.index('by_cardId_ownerId', ['cardId', 'ownerId'])
		.index('by_cardId_date', ['cardId', 'date'])
		.index('by_ownerId_rating_date', ['ownerId', 'rating', 'date']),
})

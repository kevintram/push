import * as v from 'valibot'

import { type Review, type ReviewListItem } from './review.types'

export const ReviewSchema: v.GenericSchema<Review> = v.object({
	id: v.number(),
	reviewCardId: v.number(),
	rating: v.nullable(v.picklist(['miss', 'hard', 'good', 'easy'])),

	description: v.string(),
	notes: v.string(),
	scheduledAt: v.nullable(v.string()),
	completedAt: v.nullable(v.string()),
	effectiveDate: v.nullable(v.string()),

	insertedAt: v.string(),
	updatedAt: v.string(),
	reviewCard: v.object({
		id: v.number(),
		topicId: v.number(),
		type: v.picklist(['practice', 'flashcard']),
		primaryText: v.string(),
		secondaryText: v.string(),
	}),

	// Entity FSRS state before review
	stabilityBefore: v.nullable(v.number()),
	difficultyBefore: v.nullable(v.number()),
	stateBefore: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	stepBefore: v.nullable(v.number()),
	dueBefore: v.nullable(v.string()),

	// Entity FSRS state after review
	stabilityAfter: v.nullable(v.number()),
	difficultyAfter: v.nullable(v.number()),
	stateAfter: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	stepAfter: v.nullable(v.number()),
	dueAfter: v.nullable(v.string()),
})

export const ReviewListItemSchema: v.GenericSchema<ReviewListItem> =
	ReviewSchema

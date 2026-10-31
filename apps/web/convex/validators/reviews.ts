import { type Infer, v } from 'convex/values'

import { cardRead, learningState } from './cards'
import { rating } from './reviewRatings'

export { rating }

export const reviewBase = v.object({
	ownerId: v.string(),
	cardId: v.id('cards'),
	rating: v.optional(rating),
	date: v.optional(v.string()), // YYYY-MM-DD
	description: v.string(),
	notes: v.string(),
	stabilityBefore: v.optional(v.number()),
	difficultyBefore: v.optional(v.number()),
	stateBefore: v.optional(learningState),
	stepBefore: v.optional(v.number()),
	dueDateBefore: v.optional(v.string()),
	stabilityAfter: v.optional(v.number()),
	difficultyAfter: v.optional(v.number()),
	stateAfter: v.optional(learningState),
	stepAfter: v.optional(v.number()),
	dueDateAfter: v.optional(v.string()),
})

export const reviewRead = reviewBase.extend({
	_id: v.id('reviews'),
	_creationTime: v.number(),
})

export const reviewCreate = v.object({
	...reviewBase
		.omit(
			'ownerId',
			'cardId',
			'stabilityBefore',
			'difficultyBefore',
			'stateBefore',
			'stepBefore',
			'dueDateBefore',
			'stabilityAfter',
			'difficultyAfter',
			'stateAfter',
			'stepAfter',
			'dueDateAfter',
		)
		.partial().fields,
	cardId: v.id('cards'),
})

export const reviewPatch = reviewBase
	.omit(
		'ownerId',
		'cardId',
		'rating',
		'date',
		'stabilityBefore',
		'difficultyBefore',
		'stateBefore',
		'stepBefore',
		'dueDateBefore',
		'stabilityAfter',
		'difficultyAfter',
		'stateAfter',
		'stepAfter',
		'dueDateAfter',
	)
	.extend({
		rating: v.union(rating, v.null()),
		date: v.union(v.string(), v.null()),
	})
	.partial()

// A new review and its card, both as they stand once the review is scheduled.
export const reviewCreated = v.object({
	review: reviewRead,
	card: cardRead,
})

export type Review = Infer<typeof reviewRead>
export type ReviewCreate = Infer<typeof reviewCreate>
export type ReviewCreated = Infer<typeof reviewCreated>
export type ReviewPatch = Infer<typeof reviewPatch>

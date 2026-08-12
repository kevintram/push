import { type Infer, v } from 'convex/values'

import { learningState } from './reviewCards'

export const rating = v.union(
	v.literal('miss'),
	v.literal('hard'),
	v.literal('good'),
	v.literal('easy'),
)

export const reviewBase = v.object({
	ownerId: v.string(),
	reviewCardId: v.id('reviewCards'),
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

export const reviewCreate = reviewBase
	.omit(
		'ownerId',
		'reviewCardId',
		// omit SRS columns because they're *only* handled by server
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
	.partial()
	.extend({ reviewCardId: v.id('reviewCards') }) // require

export const reviewPatch = reviewBase
	.omit(
		// omit so they're unsettable
		'ownerId',
		'reviewCardId',
		// omit so we can do the three-state jawn
		// (1. omit/undefined = leave alone 2. null = clear 3. value = set.)
		'rating',
		'date',
		// omit SRS columns because they're handled by the *server* ONLY
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

export type Review = Infer<typeof reviewRead>
export type ReviewCreate = Infer<typeof reviewCreate>
export type ReviewPatch = Infer<typeof reviewPatch>

import { v } from 'convex/values'

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
	description: v.string(),
	notes: v.string(),
	// Reviews can be unscheduled or incomplete. Date-only strings match the
	// calendar UI and avoid timezone shifts for a user's intended review day.
	// TODO(2): validate YYYY-MM-DD when review mutations are added.
	scheduledAt: v.optional(v.string()),
	completedAt: v.optional(v.string()),
	stabilityBefore: v.optional(v.number()),
	difficultyBefore: v.optional(v.number()),
	stateBefore: v.optional(learningState),
	stepBefore: v.optional(v.number()),
	dueBefore: v.optional(v.string()),
	stabilityAfter: v.optional(v.number()),
	difficultyAfter: v.optional(v.number()),
	stateAfter: v.optional(learningState),
	stepAfter: v.optional(v.number()),
	dueAfter: v.optional(v.string()),
})

export const reviewRead = reviewBase.extend({
	_id: v.id('reviews'),
	_creationTime: v.number(),
})

export const reviewCreate = reviewBase
	.omit(
		'ownerId',
		'reviewCardId',
		// omit SRS columns because they're handled by *us* ONLY
		'stabilityBefore',
		'difficultyBefore',
		'stateBefore',
		'stepBefore',
		'dueBefore',
		'stabilityAfter',
		'difficultyAfter',
		'stateAfter',
		'stepAfter',
		'dueAfter',
	)
	.partial()
	.extend({ reviewCardId: v.id('reviewCards') }) // require

// The mutable review fields. `rating`/`scheduledAt`/`completedAt` are
// three-state: omit/undefined = leave alone, null = clear, value = set.
// `Reviews.update` owns the rating/completedAt completion coupling.
// `description`/`notes` stay plain optional strings since they are never
// unset back to undefined, only ever emptied.
// `reviewCardId`/`ownerId` stay unsettable.
export const reviewPatch = reviewBase
	.omit(
		'ownerId',
		'reviewCardId',
		//
		'rating',
		'scheduledAt',
		'completedAt',
		// omit SRS columns because they're handled by *us* ONLY
		'stabilityBefore',
		'difficultyBefore',
		'stateBefore',
		'stepBefore',
		'dueBefore',
		'stabilityAfter',
		'difficultyAfter',
		'stateAfter',
		'stepAfter',
		'dueAfter',
	)
	.extend({
		rating: v.union(rating, v.null()),
		scheduledAt: v.union(v.string(), v.null()),
		completedAt: v.union(v.string(), v.null()),
	})
	.partial()

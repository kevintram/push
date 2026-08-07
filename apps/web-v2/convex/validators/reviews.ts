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
	// A review is completed exactly when it carries a rating. There is no
	// completed-but-ungraded state, so `rating` is the completion flag rather
	// than something a separate timestamp has to be kept in sync with.
	rating: v.optional(rating),
	// The day the review happened when it is rated, and the day it is scheduled
	// for when it is not. A review can also be undated, meaning "someday".
	// Invariant: a rated review always has a date. `Reviews.create`/`update` are
	// the only places that enforce it.
	// Date-only strings match the calendar UI and avoid timezone shifts for a
	// user's intended review day.
	// TODO(2): validate YYYY-MM-DD when review mutations are added.
	date: v.optional(v.string()),
	description: v.string(),
	notes: v.string(),
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

// The mutable review fields. `rating`/`date` are three-state: omit/undefined =
// leave alone, null = clear, value = set. `Reviews.update` enforces the
// rated-implies-dated invariant across the pair.
// `description`/`notes` stay plain optional strings since they are never
// unset back to undefined, only ever emptied.
// `reviewCardId`/`ownerId` stay unsettable.
export const reviewPatch = reviewBase
	.omit(
		'ownerId',
		'reviewCardId',
		//
		'rating',
		'date',
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
		date: v.union(v.string(), v.null()),
	})
	.partial()

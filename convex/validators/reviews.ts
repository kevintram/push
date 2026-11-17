import { type Infer, v } from 'convex/values'

import { cardRead, learningState } from './cards'
import { rating } from './reviewRatings'

export { rating }

export const reviewBase = v.object({
	ownerId: v.string(),
	cardId: v.id('cards'),
	// Every review is a completed recall: how it went, and the client's local
	// calendar day it happened on.
	rating,
	date: v.string(), // YYYY-MM-DD
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

// The text fields start empty when omitted. `ownerId` comes from the caller's
// identity and the SRS snapshots from replay.
export const reviewCreate = reviewBase
	.pick('cardId', 'rating', 'date')
	.extend(reviewBase.pick('description', 'notes').partial().fields)

// A review can be re-rated or re-dated but never reopened, so no field is
// clearable and every field is optional.
export const reviewPatch = reviewBase
	.pick('rating', 'date', 'description', 'notes')
	.partial()

// A new review and its card, both as they stand once SRS has run.
export const reviewCreated = v.object({
	review: reviewRead,
	card: cardRead,
})

export type Review = Infer<typeof reviewRead>
export type ReviewCreate = Infer<typeof reviewCreate>
export type ReviewCreated = Infer<typeof reviewCreated>
export type ReviewPatch = Infer<typeof reviewPatch>

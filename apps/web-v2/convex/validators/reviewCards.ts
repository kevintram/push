import { v } from 'convex/values'

export const reviewCardBase = v.object({
	topicId: v.id('topics'),
	ownerId: v.string(),
	type: v.union(v.literal('practice'), v.literal('flashcard')),
	primaryText: v.string(),
	secondaryText: v.string(),
	notes: v.string(),
	flaggedAt: v.optional(v.number()), // epoch ms; absent when unflagged
})

export const reviewCardRead = reviewCardBase.extend({
	_id: v.id('reviewCards'),
	_creationTime: v.number(),
})

// Cards are created from an empty "add" button, so everything the user
// eventually fills in is optional. `ownerId` comes from the caller's identity,
// `topicId` is passed separately, and a new card is never flagged.
export const reviewCardCreate = reviewCardBase
	.omit('ownerId', 'topicId', 'flaggedAt')
	.partial()

// The creatable fields, plus `flaggedAt` as a three-state shape
// where 1. omit/undefined = leave alone 2. null = unflag 3. number = flag.
// `topicId`/`ownerId` stay unsettable.
export const reviewCardPatch = reviewCardCreate.extend({
	flaggedAt: v.optional(v.union(v.number(), v.null())),
})

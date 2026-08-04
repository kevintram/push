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
// eventually fills in is optional. The parent topic remains required, while
// `ownerId` comes from the caller's identity and a new card is never flagged.
export const reviewCardCreate = v.object({
	...reviewCardBase.omit('ownerId', 'topicId', 'flaggedAt').partial().fields,
	topicId: v.id('topics'), // require topicId
})

// The mutable card fields, plus `flaggedAt` as a three-state shape
// where 1. omit/undefined = leave alone 2. null = unflag 3. number = flag.
// `topicId`/`ownerId` stay unsettable.
export const reviewCardPatch = reviewCardBase
	.omit('ownerId', 'topicId', 'flaggedAt')
	.extend({
		flaggedAt: v.union(v.number(), v.null()),
	})
	.partial()

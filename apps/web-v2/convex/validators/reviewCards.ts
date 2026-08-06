import { v } from 'convex/values'

export const learningState = v.union(
	v.literal('LEARNING'),
	v.literal('REVIEW'),
	v.literal('RELEARNING'),
)

export const reviewCardBase = v.object({
	topicId: v.id('topics'),
	ownerId: v.string(),
	type: v.union(v.literal('practice'), v.literal('flashcard')),
	primaryText: v.string(),
	secondaryText: v.string(),
	notes: v.string(),
	flaggedAt: v.optional(v.number()), // epoch ms; absent when unflagged
	stability: v.optional(v.number()),
	difficulty: v.optional(v.number()),
	state: learningState,
	step: v.optional(v.number()),
	lastReviewedAt: v.optional(v.string()),
})

export const reviewCardRead = reviewCardBase.extend({
	_id: v.id('reviewCards'),
	_creationTime: v.number(),
})

// Cards are created from an empty "add" button, so everything the user
// eventually fills in is optional. The parent topic remains required and
// `ownerId` comes from the caller's identity.
export const reviewCardCreate = v.object({
	...reviewCardBase
		.omit(
			'ownerId', // omit because handled by us
			// omit SRS columns because they're handled by us
			'stability',
			'difficulty',
			'state',
			'step',
			'lastReviewedAt',
		)
		.partial().fields,
	topicId: v.id('topics'), // require topicId
})

// The mutable card fields, plus `flaggedAt` as a three-state shape
// where 1. omit/undefined = leave alone 2. null = unflag 3. number = flag.
// `topicId`/`ownerId` stay unsettable.
export const reviewCardPatch = reviewCardBase
	.omit(
		'ownerId', // omit becuse handled by us
		'flaggedAt', // omit to do three-state shape (see above comment)
		// omit SRS columns because they're handled by us
		'stability',
		'difficulty',
		'state',
		'step',
		'lastReviewedAt',
	)
	.extend({
		flaggedAt: v.union(v.number(), v.null()),
	})
	.partial()

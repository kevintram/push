import { type Infer, v } from 'convex/values'

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
	dueDate: v.optional(v.string()),
	lastReviewedAt: v.optional(v.string()),
	// Derived from `primaryText`, `secondaryText`, and `notes`. Server-owned:
	// never settable by a client, always recomputed alongside its sources.
	searchText: v.string(),
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
			'ownerId', // omit because handled by server
			// omit SRS columns because they're handled by server
			'stability',
			'difficulty',
			'state',
			'step',
			'dueDate',
			'lastReviewedAt',
			'searchText', // omit because derived by server
		)
		.partial().fields,
	topicId: v.id('topics'), // require topicId
})

// The mutable card fields, plus `flaggedAt` as a three-state shape
// where 1. omit/undefined = leave alone 2. null = unflag 3. number = flag.
// Moving via `topicId` is authorized in the model; `ownerId` stays unsettable.
export const reviewCardPatch = reviewCardBase
	.omit(
		'ownerId', // omit because handled by server only
		'flaggedAt', // omit to do three-state shape (see above comment)
		// omit SRS columns because they're handled by server
		'stability',
		'difficulty',
		'state',
		'step',
		'dueDate',
		'lastReviewedAt',
		'searchText', // omit because derived by server
	)
	.extend({
		flaggedAt: v.union(v.number(), v.null()),
	})
	.partial()

export const reviewCardSearchResult = v.object({
	_id: v.id('reviewCards'),
	primaryText: v.string(),
	secondaryText: v.string(),
	notes: v.string(),
	pathTitles: v.array(v.string()), // the titles of the review card's topic path
})

export type ReviewCard = Infer<typeof reviewCardRead>
export type ReviewCardCreate = Infer<typeof reviewCardCreate>
export type ReviewCardPatch = Infer<typeof reviewCardPatch>
export type ReviewCardSearchResult = Infer<typeof reviewCardSearchResult>

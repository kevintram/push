import { type Infer, v } from 'convex/values'

import { rating } from './reviewRatings'

export const learningState = v.union(
	v.literal('LEARNING'),
	v.literal('REVIEW'),
	v.literal('RELEARNING'),
)

export const cardBase = v.object({
	collectionId: v.id('collections'),
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
	// Only the last completed review is stored here, so rating is non-null.
	lastReview: v.optional(
		v.object({
			date: v.string(),
			rating,
			id: v.id('reviews'),
		}),
	),
	// Derived from `primaryText`, `secondaryText`, and `notes`. Server-owned:
	// never settable by a client, always recomputed alongside its sources.
	searchText: v.string(),
})

export const cardRead = cardBase.extend({
	_id: v.id('cards'),
	_creationTime: v.number(),
})

// Cards are created from an empty "add" button, so everything the user
// eventually fills in is optional. The parent collection remains required and
// `ownerId` comes from the caller's identity.
export const cardCreate = v.object({
	...cardBase
		.omit(
			'ownerId', // omit because handled by server
			// omit SRS columns because they're handled by server
			'stability',
			'difficulty',
			'state',
			'step',
			'dueDate',
			'lastReview',
			'searchText', // omit because derived by server
		)
		.partial().fields,
	collectionId: v.id('collections'), // require collectionId
})

// The mutable card fields, plus `flaggedAt` as a three-state shape
// where 1. omit/undefined = leave alone 2. null = unflag 3. number = flag.
// Moving via `collectionId` is authorized in the model; `ownerId` stays unsettable.
export const cardPatch = cardBase
	.omit(
		'ownerId', // omit because handled by server only
		'flaggedAt', // omit to do three-state shape (see above comment)
		// omit SRS columns because they're handled by server
		'stability',
		'difficulty',
		'state',
		'step',
		'dueDate',
		'lastReview',
		'searchText', // omit because derived by server
	)
	.extend({
		flaggedAt: v.union(v.number(), v.null()),
	})
	.partial()

export const cardSearchResult = v.object({
	_id: v.id('cards'),
	primaryText: v.string(),
	secondaryText: v.string(),
	notes: v.string(),
	pathTitles: v.array(v.string()), // the titles of the card's collection path
})

export type Card = Infer<typeof cardRead>
export type CardCreate = Infer<typeof cardCreate>
export type CardPatch = Infer<typeof cardPatch>
export type CardSearchResult = Infer<typeof cardSearchResult>

import { type Infer, v } from 'convex/values'

import { rating } from './reviewRatings'

export const learningState = v.union(
	v.literal('LEARNING'),
	v.literal('REVIEW'),
	v.literal('RELEARNING'),
)

export const cardBase = v.object({
	collectionId: v.id('collections'),
	// Absent when the card is unsectioned. When present, the section belongs
	// to `collectionId`.
	sectionId: v.optional(v.id('sections')),
	// The card's place within its list, which is its section or, when
	// unsectioned, its collection's unsectioned cards. A fractional index key,
	// absent only on cards created before ordering existed, which sort first
	// until `migrations.backfillRanks` ranks them.
	rank: v.optional(v.string()),
	ownerId: v.string(),
	prompt: v.string(),
	answer: v.string(),
	notes: v.string(),
	flaggedAt: v.optional(v.number()), // epoch ms; absent when unflagged
	retiredAt: v.optional(v.number()), // epoch ms; absent when active
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
	// Derived from `prompt`, `answer`, and `notes`. Server-owned:
	// never settable by a client, always recomputed alongside its sources.
	searchText: v.string(),
})

// What the `cards` table stores while `migrations.flashcardsOnly` runs: a card
// written before every card became a flashcard has `type`, `primaryText`, and
// `secondaryText` instead of `prompt` and `answer`. `Cards.toCard` reads either
// shape as a `Card`.
// TODO(1): once the migration has run on every deployment, store `cardBase`.
export const cardDocument = cardBase.omit('prompt', 'answer').extend({
	prompt: v.optional(v.string()),
	answer: v.optional(v.string()),
	type: v.optional(v.union(v.literal('practice'), v.literal('flashcard'))),
	primaryText: v.optional(v.string()),
	secondaryText: v.optional(v.string()),
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
			'rank', // omit because the server appends new cards
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

// The mutable card fields, plus `flaggedAt`, `retiredAt`, and `sectionId` as
// three-state shapes where 1. omit/undefined = leave alone 2. null = clear
// (unflag / unretire / unsection) 3. value = set (flag / retire / section).
// Moving via `collectionId` or `sectionId` is authorized in the model;
// `ownerId` stays unsettable.
export const cardPatch = cardBase
	.omit(
		'ownerId', // omit because handled by server only
		'flaggedAt', // omit to do three-state shape (see above comment)
		'retiredAt', // omit to do three-state shape (see above comment)
		'sectionId', // omit to do three-state shape (see above comment)
		'rank', // omit because reordering goes through `cardMove`
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
		retiredAt: v.union(v.number(), v.null()),
		sectionId: v.union(v.id('sections'), v.null()),
	})
	.partial()

// The part of `cardPatch` that applies to many cards at once: the toggles and
// moving to another collection, but not each card's own text.
export const cardBatchPatch = cardPatch.pick(
	'flaggedAt',
	'retiredAt',
	'collectionId',
)

// Places the cards, in the given order, as a run in `sectionId`'s list (the
// unsectioned cards when `null`) right after `afterId`, or first when it is
// `null`. The cards stay in their collection. The server picks the keys, so
// clients never send one.
export const cardMove = v.object({
	sectionId: v.union(v.id('sections'), v.null()),
	afterId: v.union(v.id('cards'), v.null()),
})

// Where a card sits: its collection, its section (`null` for the unsectioned
// cards), and its key in that list (`null` for a card not yet ranked). Taken
// from a card before it moves, so the move can be undone exactly.
export const cardPlacement = v.object({
	cardId: v.id('cards'),
	collectionId: v.id('collections'),
	sectionId: v.union(v.id('sections'), v.null()),
	rank: v.union(v.string(), v.null()),
})

export const cardSearchResult = v.object({
	_id: v.id('cards'),
	prompt: v.string(),
	answer: v.string(),
	notes: v.string(),
	pathTitles: v.array(v.string()), // the titles of the card's collection path
})

export type Card = Infer<typeof cardRead>
export type CardCreate = Infer<typeof cardCreate>
export type CardPatch = Infer<typeof cardPatch>
export type CardBatchPatch = Infer<typeof cardBatchPatch>
export type CardMove = Infer<typeof cardMove>
export type CardPlacement = Infer<typeof cardPlacement>
export type CardSearchResult = Infer<typeof cardSearchResult>

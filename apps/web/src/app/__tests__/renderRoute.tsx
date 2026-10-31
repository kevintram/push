import type { Doc, Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import type { DueEntry } from '@convex/validators/due'
import { QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { ConvexProvider } from 'convex/react'

import { routeTree } from '~/app/routeTree.gen'
import { collectionQueries } from '~/modules/collections/api/collectionQueries'
import { sectionQueries } from '~/modules/collections/api/sectionQueries'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { reviewQueries } from '~/modules/reviews/api/reviewQueries'
import { HideModeProvider } from '~/modules/reviews/hide-mode/HideModeProvider'
import type { Review } from '~/modules/reviews/types/review.types'
import { createTestConvexClient } from '~/testing/createTestConvexClient'
import { createTestQueryClient } from '~/testing/createTestQueryClient'
import { todayIso } from '~/utils/date'

/*
 * Renders the app at a route over seeded query caches. Test files that use it
 * mock `@clerk/react` and `convex/react` so the auth gate renders signed in.
 */

export const collectionId = 'collection-1' as Id<'collections'>
export const cardId = 'card-1' as Id<'cards'>

export const collection: Doc<'collections'> = {
	_id: collectionId,
	_creationTime: 0,
	title: 'Learning TypeScript',
	description: '',
	ownerId: 'user-1',
	path: [],
	searchText: 'Learning TypeScript',
}

export const card: Card = {
	_id: cardId,
	_creationTime: 0,
	collectionId,
	ownerId: 'user-1',
	type: 'flashcard',
	primaryText: 'What problem do generics solve?',
	secondaryText: 'They preserve type safety across reusable code.',
	notes: '',
	state: 'LEARNING',
	lastReview: undefined,
	searchText:
		'What problem do generics solve?\nThey preserve type safety across reusable code.',
}

export const review: Review = {
	_id: 'review-1' as Id<'reviews'>,
	_creationTime: 0,
	cardId,
	ownerId: 'user-1',
	rating: 'good',
	description: 'Correctly described generics.',
	notes: '',
	date: '2026-07-28',
}

/** A card with no `dueDate` surfaces as a dateless, SRS-scheduled entry. */
export function toNewEntry(newCard: Card): DueEntry {
	return { card: newCard, scheduledReviews: [], srsScheduled: true }
}

export function renderRoute(
	path: string,
	{
		ancestors = [],
		dueEntries = [],
		lateEntries = [],
		flaggedCards = [],
		missingCard = false,
		missingCollection = false,
		newCards = [],
		cardType = 'flashcard',
		collections = [],
		collectionCards = [],
		sections = [],
	}: {
		ancestors?: Array<Doc<'collections'>>
		dueEntries?: Array<DueEntry>
		lateEntries?: Array<DueEntry>
		flaggedCards?: Array<Card>
		missingCard?: boolean
		missingCollection?: boolean
		newCards?: Array<Card>
		cardType?: Card['type']
		collections?: Array<Doc<'collections'>>
		collectionCards?: Array<Card>
		sections?: Array<Doc<'sections'>>
	} = {},
) {
	const queryClient = createTestQueryClient()
	const today = todayIso()
	if (missingCard || missingCollection) {
		queryClient.setDefaultOptions({
			queries: {
				queryFn: () => {
					throw new Error(
						missingCollection
							? 'Collection not found'
							: 'Card not found',
					)
				},
				retry: false,
				staleTime: Infinity,
			},
		})
	}
	// Breadcrumbs read `detailWithPath()`, while the sidebar and move dialog
	// read `list()`, so the `ancestors` fixture has to seed both. Deduped by id
	// so a collection passed in both `collections` and `ancestors` cannot appear twice,
	// and the detail seeds are resolved from the same map `list()` holds so the
	// caches can never disagree about the current collection.
	const collectionsById = new Map(
		[...collections, ...ancestors].map(entry => [entry._id, entry]),
	)
	const currentCollection = {
		...(collectionsById.get(collectionId) ?? collection),
		path: ancestors.map(({ _id }) => _id),
	}
	collectionsById.set(collectionId, currentCollection)
	queryClient.setQueryData(collectionQueries.list().queryKey, [
		...collectionsById.values(),
	])
	queryClient.setQueryData(
		collectionQueries.children(collectionId).queryKey,
		[...collectionsById.values()].filter(
			entry => entry.parentId === collectionId,
		),
	)
	queryClient.setQueryData(dueQueries.listDue(today).queryKey, dueEntries)
	queryClient.setQueryData(dueQueries.listLate(today).queryKey, lateEntries)
	queryClient.setQueryData(
		dueQueries.listNew().queryKey,
		newCards.map(toNewEntry),
	)
	queryClient.setQueryData(cardQueries.listFlagged().queryKey, flaggedCards)
	// Every reader of `detail` expands, and `expandPath` keys its own cache
	// entry, so only the expanded shape is seeded. Its ancestors resolve
	// through the same map, so a collection overridden via `collections` is the one the
	// trail renders.
	if (!missingCollection) {
		queryClient.setQueryData(
			collectionQueries.detail(collectionId, { expandPath: true })
				.queryKey,
			{
				...currentCollection,
				path: currentCollection.path.map(ancestorId =>
					collectionsById.get(ancestorId),
				),
			},
		)
	}
	queryClient.setQueryData(
		cardQueries.listByCollection(collectionId).queryKey,
		collectionCards,
	)
	queryClient.setQueryData(
		sectionQueries.listByCollection(collectionId).queryKey,
		sections,
	)
	// The review queue fetches each card it lands on by id.
	for (const card of newCards) {
		queryClient.setQueryData(cardQueries.detail(card._id).queryKey, card)
		queryClient.setQueryData(
			reviewQueries.listByCard(card._id).queryKey,
			[],
		)
	}
	for (const card of flaggedCards) {
		queryClient.setQueryData(cardQueries.detail(card._id).queryKey, card)
		queryClient.setQueryData(
			reviewQueries.listByCard(card._id).queryKey,
			[],
		)
	}
	if (!missingCard) {
		queryClient.setQueryData(cardQueries.detail(cardId).queryKey, {
			...card,
			type: cardType,
		})
	}
	queryClient.setQueryData(reviewQueries.listByCard(cardId).queryKey, [
		review,
	])
	const convexClient = createTestConvexClient()

	const router = createRouter({
		routeTree,
		context: {
			auth: {
				isAuthenticated: true,
				isLoading: false,
			},
			queryClient,
		},
		history: createMemoryHistory({
			initialEntries: [path],
		}),
	})

	const rendered = render(
		<ConvexProvider client={convexClient}>
			<QueryClientProvider client={queryClient}>
				<HideModeProvider>
					<RouterProvider router={router} />
				</HideModeProvider>
			</QueryClientProvider>
		</ConvexProvider>,
	)

	return { ...rendered, queryClient, router }
}

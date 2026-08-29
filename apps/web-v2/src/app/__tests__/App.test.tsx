import type { Doc, Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import type { DueEntry } from '@convex/validators/due'
import { QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConvexProvider } from 'convex/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { routeTree } from '~/app/routeTree.gen'
import { collectionQueries } from '~/modules/library/api/collectionQueries'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { reviewQueries } from '~/modules/reviews/api/reviewQueries'
import { HideModeProvider } from '~/modules/reviews/hide-mode/HideModeProvider'
import type { Review } from '~/modules/reviews/types/review.types'
import { createTestConvexClient } from '~/testing/createTestConvexClient'
import { createTestQueryClient } from '~/testing/createTestQueryClient'
import { todayIso } from '~/utils/date'

vi.mock('@clerk/react', () => ({
	SignInButton: ({ children }: { children: ReactNode }) => children,
	useClerk: () => ({ signOut: vi.fn() }),
	useUser: () => ({
		isLoaded: true,
		isSignedIn: true,
		user: {
			fullName: 'Test User',
			primaryEmailAddress: { emailAddress: 'test@example.com' },
		},
	}),
}))

// Keep Convex's data provider real while rendering the auth gate as signed in.
vi.mock('convex/react', async importOriginal => ({
	...(await importOriginal<typeof import('convex/react')>()),
	Authenticated: ({ children }: { children: ReactNode }) => children,
	AuthLoading: () => null,
	Unauthenticated: () => null,
	useConvexAuth: () => ({
		isAuthenticated: true,
		isLoading: false,
		isRefreshing: false,
	}),
}))

const collectionId = 'collection-1' as Id<'collections'>
const cardId = 'card-1' as Id<'cards'>

const collection: Doc<'collections'> = {
	_id: collectionId,
	_creationTime: 0,
	title: 'Learning TypeScript',
	description: '',
	ownerId: 'user-1',
	path: [],
	searchText: 'Learning TypeScript',
}

const card: Card = {
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

const review: Review = {
	_id: 'review-1' as Id<'reviews'>,
	_creationTime: 0,
	cardId,
	ownerId: 'user-1',
	rating: 'good',
	description: 'Correctly described generics.',
	notes: '',
	date: '2026-07-28',
}

function renderRoute(
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
	queryClient.setQueryData(dueQueries.list(today).queryKey, dueEntries)
	queryClient.setQueryData(
		dueQueries.list({ to: today }).queryKey,
		lateEntries,
	)
	queryClient.setQueryData(cardQueries.listNew().queryKey, newCards)
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
		[],
	)
	// The focus overlay fetches each card it lands on by id.
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

describe('v2 app setup', () => {
	it('renders a blank index route inside the app shell', async () => {
		renderRoute('/')

		expect(await screen.findByRole('main')).toBeEmptyDOMElement()
	})

	it('renders the review route at its default due state', async () => {
		renderRoute('/review')

		expect(
			await screen.findByRole(
				'heading',
				{ level: 1, name: 'Due' },
				{ timeout: 3000 },
			),
		).toBeInTheDocument()
		expect(screen.getByText('No due cards.')).toBeInTheDocument()
	})

	it('renders today’s due entry', async () => {
		const today = todayIso()
		renderRoute('/review/due', {
			dueEntries: [
				{
					card: card,
					date: today,
					scheduledReviews: [{ ...review, rating: undefined }],
					srsScheduled: true,
				},
			],
		})

		expect(
			await screen.findByRole('link', {
				name: 'What problem do generics solve?',
			}),
		).toBeInTheDocument()
	})

	it('deduplicates late entries for the same card on different days', async () => {
		renderRoute('/review/late', {
			lateEntries: [
				{
					card: card,
					date: '2020-01-02',
					scheduledReviews: [],
					srsScheduled: true,
				},
				{
					card: card,
					date: '2020-01-01',
					scheduledReviews: [{ ...review, rating: undefined }],
					srsScheduled: false,
				},
			],
		})

		expect(
			await screen.findAllByRole('link', {
				name: 'What problem do generics solve?',
			}),
		).toHaveLength(1)
	})

	it('renders new cards without due-entry context', async () => {
		renderRoute('/review/new', { newCards: [card] })

		expect(
			await screen.findByRole('link', {
				name: 'What problem do generics solve?',
			}),
		).toBeInTheDocument()
	})

	it('renders all flagged cards', async () => {
		const practiceCard: Card = {
			...card,
			_id: 'practice-card' as Id<'cards'>,
			flaggedAt: 1,
			primaryText: 'Practice prompt',
			type: 'practice',
		}
		const flashcard: Card = {
			...card,
			_id: 'flashcard-card' as Id<'cards'>,
			flaggedAt: 2,
			primaryText: 'Flashcard prompt',
		}
		renderRoute('/flagged', {
			flaggedCards: [flashcard, practiceCard],
		})

		expect(
			await screen.findByRole('heading', {
				level: 1,
				name: 'Flagged',
			}),
		).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: 'Flashcard prompt' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: 'Practice prompt' }),
		).toBeInTheDocument()
	})

	it('shows the flagged empty state and disables focus', async () => {
		renderRoute('/flagged')

		expect(await screen.findByText('No flagged cards.')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Focus' })).toBeDisabled()
	})

	it('passes all flagged cards into focus mode', async () => {
		const user = userEvent.setup()
		const practiceCard: Card = {
			...card,
			_id: 'practice-card' as Id<'cards'>,
			flaggedAt: 1,
			primaryText: 'Practice prompt',
			type: 'practice',
		}
		const flashcard: Card = {
			...card,
			_id: 'flashcard-card' as Id<'cards'>,
			flaggedAt: 2,
			primaryText: 'Flashcard prompt',
		}
		renderRoute('/flagged', {
			flaggedCards: [flashcard, practiceCard],
		})

		await user.click(await screen.findByRole('button', { name: 'Focus' }))
		expect(
			await screen.findByDisplayValue('Flashcard prompt'),
		).toBeInTheDocument()
		expect(screen.getByText('1 of 2')).toBeInTheDocument()
	})

	it('renders the selected card in focus mode', async () => {
		const user = userEvent.setup()
		renderRoute('/review/new', { newCards: [card] })

		await user.click(await screen.findByRole('button', { name: 'Focus' }))

		expect(
			screen.getByRole('dialog', { name: 'Focus cards' }),
		).toBeInTheDocument()
		expect(
			await screen.findByDisplayValue('What problem do generics solve?'),
		).toBeInTheDocument()
		expect(screen.getByText('1 of 1')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Previous card' }),
		).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Next card' })).toBeDisabled()
		expect(screen.getByLabelText('Card primary text')).not.toHaveAttribute(
			'readonly',
		)
		// Base UI keeps `role="button"` on the non-native element, but it stays
		// a real anchor so middle-click and open-in-new-tab still work.
		const openLink = screen.getByRole('button', {
			name: 'Open card',
		})
		expect(openLink.tagName).toBe('A')
		expect(openLink).toHaveAttribute('href', '/cards/card-1')
		expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
			'aria-selected',
			'true',
		)
		expect(screen.getByRole('tab', { name: 'Overview' }).tagName).toBe(
			'BUTTON',
		)
		expect(
			screen.getByRole('complementary', {
				name: 'Card details',
			}),
		).toBeInTheDocument()
	})

	it('resets the focus tab when advancing to another card', async () => {
		const user = userEvent.setup()
		const secondCard: Card = {
			...card,
			_id: 'card-2' as Id<'cards'>,
			primaryText: 'What is a discriminated union?',
		}
		renderRoute('/review/new', { newCards: [card, secondCard] })

		await user.click(await screen.findByRole('button', { name: 'Focus' }))
		await user.click(await screen.findByRole('tab', { name: 'Reviews' }))
		expect(
			await screen.findByRole('form', { name: 'Add review' }),
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Next card' }))

		expect(
			await screen.findByDisplayValue('What is a discriminated union?'),
		).toBeInTheDocument()
		expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
			'aria-selected',
			'true',
		)
	})

	it('closes focus mode before following a breadcrumb', async () => {
		const user = userEvent.setup()
		renderRoute('/review/new', { newCards: [card] })

		await user.click(await screen.findByRole('button', { name: 'Focus' }))
		await user.click(await screen.findByRole('link', { name: 'Library' }))

		await waitFor(() =>
			expect(
				screen.queryByRole('dialog', { name: 'Focus cards' }),
			).not.toBeInTheDocument(),
		)
	})

	it('resumes on the card being read when focus is reopened', async () => {
		const user = userEvent.setup()
		const secondCard: Card = {
			...card,
			_id: 'card-2' as Id<'cards'>,
			primaryText: 'What is a discriminated union?',
		}
		renderRoute('/review/new', { newCards: [card, secondCard] })

		await user.click(await screen.findByRole('button', { name: 'Focus' }))
		await user.click(
			await screen.findByRole('button', { name: 'Next card' }),
		)
		expect(
			await screen.findByDisplayValue('What is a discriminated union?'),
		).toBeInTheDocument()
		expect(screen.getByText('2 of 2')).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Close' }))
		await waitFor(() =>
			expect(
				screen.queryByDisplayValue('What is a discriminated union?'),
			).not.toBeInTheDocument(),
		)

		await user.click(screen.getByRole('button', { name: 'Focus' }))
		expect(
			await screen.findByDisplayValue('What is a discriminated union?'),
		).toBeInTheDocument()
		expect(screen.getByText('2 of 2')).toBeInTheDocument()
	})

	it('keeps the selected card stable as the focus queue changes', async () => {
		const user = userEvent.setup()
		const secondCard: Card = {
			...card,
			_id: 'card-2' as Id<'cards'>,
			primaryText: 'What is a discriminated union?',
		}
		const thirdCard: Card = {
			...card,
			_id: 'card-3' as Id<'cards'>,
			primaryText: 'What is type narrowing?',
		}
		const { queryClient } = renderRoute('/review/new', {
			newCards: [card, secondCard, thirdCard],
		})

		await user.click(await screen.findByRole('button', { name: 'Focus' }))
		await user.click(
			await screen.findByRole('button', { name: 'Next card' }),
		)

		act(() => {
			queryClient.setQueryData(cardQueries.listNew().queryKey, [
				secondCard,
				thirdCard,
			])
		})
		expect(
			await screen.findByDisplayValue('What is a discriminated union?'),
		).toBeInTheDocument()
		expect(screen.getByText('1 of 2')).toBeInTheDocument()

		act(() => {
			queryClient.setQueryData(cardQueries.listNew().queryKey, [
				thirdCard,
			])
		})
		expect(
			await screen.findByDisplayValue('What is type narrowing?'),
		).toBeInTheDocument()
		expect(screen.getByText('1 of 1')).toBeInTheDocument()

		act(() => {
			queryClient.setQueryData(cardQueries.listNew().queryKey, [
				card,
				thirdCard,
			])
		})
		expect(
			await screen.findByDisplayValue('What is type narrowing?'),
		).toBeInTheDocument()
		expect(screen.getByText('2 of 2')).toBeInTheDocument()
	})

	it('disables focus mode when the list is empty', async () => {
		renderRoute('/review/new')

		expect(
			await screen.findByRole('button', { name: 'Focus' }),
		).toBeDisabled()
	})

	it.each([
		['/flagged', 'Flagged'],
		['/settings', 'Settings'],
	])('renders the %s route', async (path, heading) => {
		renderRoute(path)

		expect(
			await screen.findByRole('heading', { name: heading }),
		).toBeInTheDocument()
	})

	it('puts account settings on the settings route', async () => {
		renderRoute('/settings')

		expect(
			await screen.findByRole('heading', { name: 'Account' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Sign out' }),
		).toBeInTheDocument()
	})

	it('opens search over the current page without navigating away', async () => {
		const user = userEvent.setup()
		renderRoute('/settings')

		await screen.findByRole('heading', { name: 'Account' })
		await user.click(screen.getByRole('button', { name: 'Search' }))

		expect(
			await screen.findByRole('searchbox', {
				name: 'Search collections and cards',
			}),
		).toBeInTheDocument()
		// The settings page stays mounted behind the modal, so it is only
		// hidden from the accessibility tree rather than unmounted.
		expect(
			screen.getByRole('heading', { hidden: true, name: 'Account' }),
		).toBeInTheDocument()
	})

	it('renders the blank library index route', async () => {
		renderRoute('/library')

		expect(
			await screen.findByRole('navigation', {
				name: 'Library collections',
			}),
		).toBeInTheDocument()
		expect(
			screen.queryByRole('heading', { name: 'Library' }),
		).not.toBeInTheDocument()
	})

	it('collapses and expands nested library collections', async () => {
		const user = userEvent.setup()
		const childCollectionId = 'collection-2' as Id<'collections'>
		const grandchildCollectionId = 'collection-3' as Id<'collections'>

		renderRoute('/library', {
			collections: [
				{ ...collection, title: 'Languages' },
				{
					...collection,
					_id: childCollectionId,
					parentId: collectionId,
					title: 'TypeScript',
				},
				{
					...collection,
					_id: grandchildCollectionId,
					parentId: childCollectionId,
					title: 'Generics',
				},
			],
		})

		const parentToggle = await screen.findByRole('button', {
			name: 'Collapse Languages',
		})
		expect(parentToggle).toHaveAttribute('aria-expanded', 'true')
		expect(
			screen.getByRole('link', { name: 'TypeScript' }),
		).toBeInTheDocument()

		await user.click(parentToggle)

		expect(
			screen.queryByRole('link', { name: 'TypeScript' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Expand Languages' }),
		).toHaveAttribute('aria-expanded', 'false')

		await user.click(
			screen.getByRole('button', { name: 'Expand Languages' }),
		)

		expect(
			screen.getByRole('link', { name: 'TypeScript' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: 'Generics' }),
		).toBeInTheDocument()
	})

	it('does not render a collapse control for leaf collections', async () => {
		renderRoute('/library', { collections: [collection] })

		expect(
			await screen.findByRole('link', { name: 'Learning TypeScript' }),
		).toBeInTheDocument()
		expect(
			screen.queryByRole('button', {
				name: 'Collapse Learning TypeScript',
			}),
		).not.toBeInTheDocument()
	})

	it('renders a collection breadcrumb from the library through its ancestors', async () => {
		const root: Doc<'collections'> = {
			...collection,
			_id: 'collection-root' as Id<'collections'>,
			title: 'Programming',
		}
		const parent: Doc<'collections'> = {
			...collection,
			_id: 'collection-parent' as Id<'collections'>,
			parentId: root._id,
			title: 'Languages',
		}

		renderRoute(`/library/${collectionId}`, { ancestors: [root, parent] })

		const breadcrumb = await screen.findByRole('navigation', {
			name: 'Collection path',
		})
		const links = within(breadcrumb).getAllByRole('link')
		expect(links.map(link => link.textContent)).toEqual([
			'Library',
			'Programming',
			'Languages',
		])
		expect(links[0]).toHaveAttribute('href', '/library')
		expect(links[1]).toHaveAttribute('href', `/library/${root._id}`)
		expect(links[2]).toHaveAttribute('href', `/library/${parent._id}`)
		expect(
			within(breadcrumb).getByText('Learning TypeScript'),
		).toHaveAttribute('aria-current', 'page')
	})

	it('renders the shared error page when a collection does not exist', async () => {
		renderRoute(`/library/${collectionId}`, {
			missingCollection: true,
		})

		expect(
			await screen.findByRole('heading', {
				name: 'Something went wrong',
			}),
		).toBeInTheDocument()
		expect(screen.getByText('Collection not found')).toBeInTheDocument()
	})

	it('renders a card at its standalone route', async () => {
		const root: Doc<'collections'> = {
			...collection,
			_id: 'collection-root' as Id<'collections'>,
			title: 'Programming',
		}

		renderRoute(`/cards/${cardId}`, { ancestors: [root] })

		const primaryText = await screen.findByLabelText('Card primary text')
		expect(primaryText).toHaveValue('What problem do generics solve?')
		expect(primaryText).toHaveAttribute('placeholder', 'Prompt')
		expect(screen.getByLabelText('Card secondary text')).toHaveAttribute(
			'placeholder',
			'Answer',
		)
		const breadcrumb = screen.getByRole('navigation', {
			name: 'Collection path',
		})
		const links = within(breadcrumb).getAllByRole('link')
		expect(links.map(link => link.textContent)).toEqual([
			'Library',
			'Programming',
			'Learning TypeScript',
		])
		expect(links[0]).toHaveAttribute('href', '/library')
		expect(links[1]).toHaveAttribute('href', `/library/${root._id}`)
		expect(links[2]).toHaveAttribute('href', `/library/${collectionId}`)
		expect(
			within(breadcrumb).getByText('What problem do generics solve?'),
		).toHaveAttribute('aria-current', 'page')
		expect(
			screen.queryByRole('navigation', { name: 'Library collections' }),
		).not.toBeInTheDocument()
	})

	it('uses practice-specific card placeholders', async () => {
		renderRoute(`/cards/${cardId}`, {
			cardType: 'practice',
		})

		expect(
			await screen.findByLabelText('Card primary text'),
		).toHaveAttribute('placeholder', 'Title')
		expect(screen.getByLabelText('Card secondary text')).toHaveAttribute(
			'placeholder',
			'Add description...',
		)
	})

	it('renders the shared error page when a card does not exist', async () => {
		renderRoute(`/cards/${cardId}`, {
			missingCard: true,
		})

		expect(
			await screen.findByRole('heading', {
				name: 'Something went wrong',
			}),
		).toBeInTheDocument()
		expect(screen.getByText('Card not found')).toBeInTheDocument()
	})

	it('renders review history under the standalone card route', async () => {
		const { router } = renderRoute(`/cards/${cardId}/reviews`)

		expect(
			await screen.findAllByText('Correctly described generics.'),
		).not.toHaveLength(0)
		expect(screen.getByRole('tab', { name: 'Reviews' })).toHaveAttribute(
			'aria-selected',
			'true',
		)
		expect(router.state.location.pathname).toBe(`/cards/${cardId}/reviews`)
	})

	it('updates the standalone URL when changing card tabs', async () => {
		const user = userEvent.setup()
		const { router } = renderRoute(`/cards/${cardId}`)
		const reviewsTab = await screen.findByRole('tab', { name: 'Reviews' })

		expect(reviewsTab.tagName).toBe('A')
		expect(reviewsTab).toHaveAttribute('href', `/cards/${cardId}/reviews`)
		await user.click(reviewsTab)

		await waitFor(() =>
			expect(router.state.location.pathname).toBe(
				`/cards/${cardId}/reviews`,
			),
		)
		expect(screen.getByRole('tab', { name: 'Reviews' })).toHaveAttribute(
			'aria-selected',
			'true',
		)
		expect(
			await screen.findByRole('form', { name: 'Add review' }),
		).toBeInTheDocument()
	})

	it('renders the not found route', async () => {
		renderRoute('/missing')

		expect(
			await screen.findByRole('heading', { name: 'Page not found' }),
		).toBeInTheDocument()
	})
})

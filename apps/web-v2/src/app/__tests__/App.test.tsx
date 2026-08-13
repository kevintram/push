import type { Doc, Id } from '@convex/_generated/dataModel'
import type { DueEntry } from '@convex/validators/due'
import type { ReviewCard } from '@convex/validators/reviewCards'
import { QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConvexProvider } from 'convex/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { routeTree } from '~/app/routeTree.gen'
import { topicQueries } from '~/modules/library/api/topicQueries'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'
import { reviewQueries } from '~/modules/reviews/api/reviewQueries'
import { HideModeProvider } from '~/modules/reviews/hide-mode/HideModeProvider'
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

const topicId = 'topic-1' as Id<'topics'>
const reviewCardId = 'review-card-1' as Id<'reviewCards'>

const topic: Doc<'topics'> = {
	_id: topicId,
	_creationTime: 0,
	title: 'Learning TypeScript',
	description: '',
	ownerId: 'user-1',
}

const reviewCard: ReviewCard = {
	_id: reviewCardId,
	_creationTime: 0,
	topicId,
	ownerId: 'user-1',
	type: 'flashcard',
	primaryText: 'What problem do generics solve?',
	secondaryText: 'They preserve type safety across reusable code.',
	notes: '',
	state: 'LEARNING',
}

const review: Doc<'reviews'> = {
	_id: 'review-1' as Id<'reviews'>,
	_creationTime: 0,
	reviewCardId,
	ownerId: 'user-1',
	rating: 'good',
	description: 'Correctly described generics.',
	notes: '',
	date: '2026-07-28',
}

function renderRoute(
	path: string,
	{
		dueEntries = [],
		lateEntries = [],
		missingReviewCard = false,
		newReviewCards = [],
		reviewHistoryError = false,
		reviewCardType = 'flashcard',
	}: {
		dueEntries?: Array<DueEntry>
		lateEntries?: Array<DueEntry>
		missingReviewCard?: boolean
		newReviewCards?: Array<ReviewCard>
		reviewHistoryError?: boolean
		reviewCardType?: ReviewCard['type']
	} = {},
) {
	const queryClient = createTestQueryClient()
	const today = todayIso()
	if (missingReviewCard) {
		queryClient.setDefaultOptions({
			queries: {
				queryFn: () => {
					throw new Error('Review card not found')
				},
				retry: false,
				staleTime: Infinity,
			},
		})
	}
	queryClient.setQueryData(topicQueries.list().queryKey, [])
	queryClient.setQueryData(dueQueries.list(today).queryKey, dueEntries)
	queryClient.setQueryData(
		dueQueries.list({ to: today }).queryKey,
		lateEntries,
	)
	queryClient.setQueryData(
		reviewCardQueries.listNew().queryKey,
		newReviewCards,
	)
	queryClient.setQueryData(topicQueries.detail(topicId).queryKey, topic)
	// The focus overlay fetches each card it lands on by id.
	for (const card of newReviewCards) {
		queryClient.setQueryData(
			reviewCardQueries.detail(card._id).queryKey,
			card,
		)
		if (!reviewHistoryError) {
			queryClient.setQueryData(
				reviewQueries.listByReviewCard(card._id).queryKey,
				[],
			)
		}
	}
	if (!missingReviewCard) {
		queryClient.setQueryData(
			reviewCardQueries.detail(reviewCardId).queryKey,
			{
				...reviewCard,
				type: reviewCardType,
			},
		)
	}
	if (!reviewHistoryError) {
		queryClient.setQueryData(
			reviewQueries.listByReviewCard(reviewCardId).queryKey,
			[review],
		)
	}
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

	return { ...rendered, queryClient }
}

describe('v2 app setup', () => {
	it('renders the index route', async () => {
		renderRoute('/')

		expect(
			await screen.findByRole('heading', {
				name: 'A clean foundation for the rewrite.',
			}),
		).toBeInTheDocument()
		expect(screen.getByText('3gulp v2')).toBeInTheDocument()
	})

	it('renders the review route at its default due state', async () => {
		renderRoute('/review')

		expect(
			await screen.findByRole('heading', { name: 'Due' }),
		).toBeInTheDocument()
	})

	it('renders today’s due entry', async () => {
		const today = todayIso()
		renderRoute('/review/due', {
			dueEntries: [
				{
					card: reviewCard,
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
					card: reviewCard,
					date: '2020-01-02',
					scheduledReviews: [],
					srsScheduled: true,
				},
				{
					card: reviewCard,
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
		renderRoute('/review/new', { newReviewCards: [reviewCard] })

		expect(
			await screen.findByRole('link', {
				name: 'What problem do generics solve?',
			}),
		).toBeInTheDocument()
	})

	it('renders the selected review card in focus mode', async () => {
		const user = userEvent.setup()
		renderRoute('/review/new', { newReviewCards: [reviewCard] })

		await user.click(await screen.findByRole('button', { name: 'Focus' }))

		expect(
			screen.getByRole('dialog', { name: 'Focus review cards' }),
		).toBeInTheDocument()
		expect(
			await screen.findByDisplayValue('What problem do generics solve?'),
		).toBeInTheDocument()
		expect(screen.getByText('1 of 1')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Previous review card' }),
		).toBeDisabled()
		expect(
			screen.getByRole('button', { name: 'Next review card' }),
		).toBeDisabled()
		expect(
			screen.getByLabelText('Review-card primary text'),
		).not.toHaveAttribute('readonly')
		expect(
			screen.getByText('Correctly described generics.'),
		).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: 'See all' }),
		).toBeInTheDocument()
		// Base UI keeps `role="button"` on the non-native element, but it stays
		// a real anchor so middle-click and open-in-new-tab still work.
		const openLink = screen.getByRole('button', {
			name: 'Open review card',
		})
		expect(openLink.tagName).toBe('A')
		expect(openLink).toHaveAttribute('href', '/review-cards/review-card-1')
	})

	it('keeps a review-history failure inside focus mode', async () => {
		const user = userEvent.setup()
		renderRoute('/review/new', {
			newReviewCards: [reviewCard],
			reviewHistoryError: true,
		})

		await user.click(await screen.findByRole('button', { name: 'Focus' }))

		expect(
			await screen.findByText('Could not load this review card.'),
		).toBeInTheDocument()
		expect(
			screen.getByRole('dialog', { name: 'Focus review cards' }),
		).toBeInTheDocument()
	})

	it('resumes on the card being read when focus is reopened', async () => {
		const user = userEvent.setup()
		const secondCard: ReviewCard = {
			...reviewCard,
			_id: 'review-card-2' as Id<'reviewCards'>,
			primaryText: 'What is a discriminated union?',
		}
		renderRoute('/review/new', { newReviewCards: [reviewCard, secondCard] })

		await user.click(await screen.findByRole('button', { name: 'Focus' }))
		await user.click(
			await screen.findByRole('button', { name: 'Next review card' }),
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
		const secondCard: ReviewCard = {
			...reviewCard,
			_id: 'review-card-2' as Id<'reviewCards'>,
			primaryText: 'What is a discriminated union?',
		}
		const thirdCard: ReviewCard = {
			...reviewCard,
			_id: 'review-card-3' as Id<'reviewCards'>,
			primaryText: 'What is type narrowing?',
		}
		const { queryClient } = renderRoute('/review/new', {
			newReviewCards: [reviewCard, secondCard, thirdCard],
		})

		await user.click(await screen.findByRole('button', { name: 'Focus' }))
		await user.click(
			await screen.findByRole('button', { name: 'Next review card' }),
		)

		act(() => {
			queryClient.setQueryData(reviewCardQueries.listNew().queryKey, [
				secondCard,
				thirdCard,
			])
		})
		expect(
			await screen.findByDisplayValue('What is a discriminated union?'),
		).toBeInTheDocument()
		expect(screen.getByText('1 of 2')).toBeInTheDocument()

		act(() => {
			queryClient.setQueryData(reviewCardQueries.listNew().queryKey, [
				thirdCard,
			])
		})
		expect(
			await screen.findByDisplayValue('What is type narrowing?'),
		).toBeInTheDocument()
		expect(screen.getByText('1 of 1')).toBeInTheDocument()

		act(() => {
			queryClient.setQueryData(reviewCardQueries.listNew().queryKey, [
				reviewCard,
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
		['/recent', 'Recent'],
		['/pinned', 'Pinned'],
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

	it('renders the blank library index route', async () => {
		renderRoute('/library')

		expect(
			await screen.findByRole('navigation', { name: 'Library topics' }),
		).toBeInTheDocument()
		expect(
			screen.queryByRole('heading', { name: 'Library' }),
		).not.toBeInTheDocument()
	})

	it('renders a review card at its standalone route', async () => {
		renderRoute(`/review-cards/${reviewCardId}`)

		const primaryText = await screen.findByLabelText(
			'Review-card primary text',
		)
		expect(primaryText).toHaveValue('What problem do generics solve?')
		expect(primaryText).toHaveAttribute('placeholder', 'Prompt')
		expect(
			screen.getByLabelText('Review-card secondary text'),
		).toHaveAttribute('placeholder', 'Answer')
		expect(
			screen.getByRole('link', { name: 'Learning TypeScript' }),
		).toHaveAttribute('href', `/library/${topicId}`)
		expect(
			screen.queryByRole('navigation', { name: 'Library topics' }),
		).not.toBeInTheDocument()
	})

	it('uses practice-specific review-card placeholders', async () => {
		renderRoute(`/review-cards/${reviewCardId}`, {
			reviewCardType: 'practice',
		})

		expect(
			await screen.findByLabelText('Review-card primary text'),
		).toHaveAttribute('placeholder', 'Title')
		expect(
			screen.getByLabelText('Review-card secondary text'),
		).toHaveAttribute('placeholder', 'Description')
	})

	it('renders the shared error page when a review card does not exist', async () => {
		renderRoute(`/review-cards/${reviewCardId}`, {
			missingReviewCard: true,
		})

		expect(
			await screen.findByRole('heading', {
				name: 'Something went wrong',
			}),
		).toBeInTheDocument()
		expect(screen.getByText('Review card not found')).toBeInTheDocument()
	})

	it('renders review history under the standalone review-card route', async () => {
		renderRoute(`/review-cards/${reviewCardId}/reviews`)

		expect(
			await screen.findByText('Correctly described generics.'),
		).toBeInTheDocument()
	})

	it('renders the not found route', async () => {
		renderRoute('/missing')

		expect(
			await screen.findByRole('heading', { name: 'Page not found' }),
		).toBeInTheDocument()
	})
})

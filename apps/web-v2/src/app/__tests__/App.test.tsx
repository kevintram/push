import type { Doc, Id } from '@convex/_generated/dataModel'
import { QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { ConvexProvider } from 'convex/react'
import { describe, expect, it, vi } from 'vitest'

import { routeTree } from '~/app/routeTree.gen'
import { topicQueries } from '~/modules/library/api/topicQueries'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'
import { reviewQueries } from '~/modules/reviews/api/reviewQueries'
import { HideModeProvider } from '~/modules/reviews/hide-mode/HideModeProvider'
import { createTestConvexClient } from '~/testing/createTestConvexClient'
import { createTestQueryClient } from '~/testing/createTestQueryClient'

vi.mock('@workos-inc/authkit-react', () => ({
	useAuth: () => ({
		isLoading: false,
		signIn: vi.fn(),
		signOut: vi.fn(),
		user: {
			email: 'test@example.com',
			firstName: 'Test',
			lastName: 'User',
		},
	}),
}))

// Only the auth hook is stubbed. The rest of `convex/react` stays real so that
// `@convex-dev/react-query` can still import from it.
vi.mock('convex/react', async importOriginal => ({
	...(await importOriginal<typeof import('convex/react')>()),
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

const reviewCard: Doc<'reviewCards'> = {
	_id: reviewCardId,
	_creationTime: 0,
	topicId,
	ownerId: 'user-1',
	type: 'flashcard',
	primaryText: 'What problem do generics solve?',
	secondaryText: 'They preserve type safety across reusable code.',
	notes: '',
}

const review: Doc<'reviews'> = {
	_id: 'review-1' as Id<'reviews'>,
	_creationTime: 0,
	reviewCardId,
	ownerId: 'user-1',
	rating: 'good',
	description: 'Correctly described generics.',
	notes: '',
	completedAt: '2026-07-28',
}

function renderRoute(
	path: string,
	{
		missingReviewCard = false,
		reviewCardType = 'flashcard',
	}: {
		missingReviewCard?: boolean
		reviewCardType?: Doc<'reviewCards'>['type']
	} = {},
) {
	const queryClient = createTestQueryClient()
	queryClient.setQueryData(topicQueries.list().queryKey, [])
	queryClient.setQueryData(topicQueries.detail(topicId).queryKey, topic)
	queryClient.setQueryData(
		reviewCardQueries.detail(reviewCardId).queryKey,
		missingReviewCard ? null : { ...reviewCard, type: reviewCardType },
	)
	queryClient.setQueryData(
		reviewQueries.listByReviewCard(reviewCardId).queryKey,
		[review],
	)
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

	return render(
		<ConvexProvider client={convexClient}>
			<QueryClientProvider client={queryClient}>
				<HideModeProvider>
					<RouterProvider router={router} />
				</HideModeProvider>
			</QueryClientProvider>
		</ConvexProvider>,
	)
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

	it('404s a review card that no longer exists', async () => {
		renderRoute(`/review-cards/${reviewCardId}`, {
			missingReviewCard: true,
		})

		expect(
			await screen.findByRole('heading', { name: 'Page not found' }),
		).toBeInTheDocument()
		// A deleted card must not reach the error boundary: `notFound()` is a
		// router control-flow object, and the root boundary renders it as
		// "[object Object]" if a component throws it during render.
		expect(
			screen.queryByText('Something went wrong'),
		).not.toBeInTheDocument()
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

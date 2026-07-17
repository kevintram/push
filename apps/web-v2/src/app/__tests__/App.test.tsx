import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { routeTree } from '~/app/routeTree.gen'

vi.mock('~/modules/reviews/api/getReviewCards', () => ({
	fetchReviewCard: async () => ({
		id: 3,
		topic_id: 1,
		primary_text: 'Question',
		secondary_text: 'Answer',
		notes: 'Notes',
	}),
	fetchReviewCards: async () => [],
}))

vi.mock('~/modules/reviews/api/getReviews', () => ({
	fetchReviews: async () => [],
}))

vi.mock('~/modules/library/api/getTopics', () => ({
	fetchTopic: async () => ({ id: 1, title: 'Topic', body: '' }),
	fetchTopics: async () => [],
}))

function renderRoute(path: string) {
	const queryClient = new QueryClient()
	const router = createRouter({
		routeTree,
		context: {
			queryClient,
		},
		history: createMemoryHistory({
			initialEntries: [path],
		}),
	})

	return render(
		<QueryClientProvider client={queryClient}>
			<RouterProvider context={{ queryClient }} router={router} />
		</QueryClientProvider>,
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
		['/library', 'Library'],
		['/settings', 'Settings'],
	])('renders the %s route', async (path, heading) => {
		renderRoute(path)

		expect(
			await screen.findByRole('heading', { name: heading }),
		).toBeInTheDocument()
	})

	it('renders a review card at its standalone route', async () => {
		renderRoute('/review-cards/3')

		expect(
			await screen.findByLabelText('Review-card primary text'),
		).toHaveValue('Question')
		expect(screen.getByRole('link', { name: 'Topic' })).toHaveAttribute(
			'href',
			'/library/1',
		)
		expect(
			screen.queryByRole('navigation', { name: 'Library topics' }),
		).not.toBeInTheDocument()
	})

	it('renders review history under the standalone review-card route', async () => {
		renderRoute('/review-cards/3/reviews')

		expect(await screen.findByText('No reviews yet.')).toBeInTheDocument()
	})

	it('renders the not found route', async () => {
		renderRoute('/missing')

		expect(
			await screen.findByRole('heading', { name: 'Page not found' }),
		).toBeInTheDocument()
	})
})

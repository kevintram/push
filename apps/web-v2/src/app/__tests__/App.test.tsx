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
import { topicQueries } from '~/modules/library'
import { HideModeProvider } from '~/stores/HideMode'
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

function renderRoute(path: string) {
	const queryClient = createTestQueryClient()
	queryClient.setQueryData(topicQueries.list().queryKey, [])
	const convexClient = createTestConvexClient()

	const router = createRouter({
		routeTree,
		context: { queryClient },
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
		renderRoute('/review-cards/3')

		expect(
			await screen.findByLabelText('Review-card primary text'),
		).toHaveValue('What problem do generics solve?')
		expect(
			screen.getByRole('link', { name: 'Learning TypeScript' }),
		).toHaveAttribute('href', '/library/learning-typescript')
		expect(
			screen.queryByRole('navigation', { name: 'Library topics' }),
		).not.toBeInTheDocument()
	})

	it('renders review history under the standalone review-card route', async () => {
		renderRoute('/review-cards/3/reviews')

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

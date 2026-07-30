import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { routeTree } from '~/app/routeTree.gen'
import { HideModeProvider } from '~/stores/HideMode'

vi.mock('@workos-inc/authkit-react', () => ({
	useAuth: () => ({
		isLoading: false,
		signIn: vi.fn(),
		signOut: vi.fn(),
		user: null,
	}),
}))

vi.mock('convex/react', () => ({
	useConvexAuth: () => ({
		isAuthenticated: false,
		isLoading: false,
		isRefreshing: false,
	}),
	useQuery: () => undefined,
}))

function renderRoute(path: string) {
	const router = createRouter({
		routeTree,
		history: createMemoryHistory({
			initialEntries: [path],
		}),
	})

	return render(
		<HideModeProvider>
			<RouterProvider router={router} />
		</HideModeProvider>,
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

	it('puts sign-in on the settings route', async () => {
		renderRoute('/settings')

		expect(
			await screen.findByRole('heading', { name: 'Account' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Sign in' }),
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

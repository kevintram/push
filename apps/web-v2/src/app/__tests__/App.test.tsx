import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { routeTree } from '~/app/routeTree.gen'

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

	it('renders the not found route', async () => {
		renderRoute('/missing')

		expect(
			await screen.findByRole('heading', { name: 'Page not found' }),
		).toBeInTheDocument()
	})
})

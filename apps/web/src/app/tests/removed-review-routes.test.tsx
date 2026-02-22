import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { routeTree } from '~/app/routeTree.gen'

function renderRoute(route: string) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { gcTime: Number.POSITIVE_INFINITY, retry: false }
		}
	})
	const router = createRouter({
		routeTree,
		history: createMemoryHistory({ initialEntries: [route] })
	})

	return render(
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	)
}

describe('removed review routes', () => {
	it.each(['/upcoming', '/today', '/unscheduled'])(
		'shows not found for %s',
		async route => {
			renderRoute(route)
			expect(await screen.findByText('Page not found')).toBeInTheDocument()
		}
	)
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '~/mocks/server'
import { HttpResponse, http } from 'msw'
import { queryClient, screen } from '~/test-utils'
import { routeTree } from './routeTree.gen'

function createTestRouter(initialEntries: string[] = ['/']) {
	const memoryHistory = createMemoryHistory({
		initialEntries
	})

	return createRouter({
		routeTree,
		history: memoryHistory
	})
}

function renderApp(route = '/') {
	const router = createTestRouter([route])
	const testQueryClient = new QueryClient({
		defaultOptions: {
			queries: { gcTime: Number.POSITIVE_INFINITY, retry: false }
		}
	})

	return {
		user: userEvent.setup(),
		...render(
			<QueryClientProvider client={testQueryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		)
	}
}

it('renders apple', async () => {
	const { user } = renderApp()

	// Wait for links to appear (data loads immediately from MSW)
	await expect(screen.findAllByRole('link')).resolves.toHaveLength(6)

	const button = await screen.findByRole('link', { name: /Apple/ })
	await user.click(button)

	await expect(screen.findByText('Vitamin K')).resolves.toBeInTheDocument()
})

it('renders home page when trying to access an invalid fruit', async () => {
	renderApp('/invalid-fruit')

	await expect(screen.findAllByRole('link')).resolves.toHaveLength(6)
})

it('renders error', async () => {
	queryClient.clear()
	server.use(http.get('/fruits', () => new HttpResponse(null, { status: 500 })))
	renderApp()

	await expect(
		screen.findByText('Failed to fetch')
	).resolves.toBeInTheDocument()
})

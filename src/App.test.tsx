import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { routeTree } from './routeTree.gen'

function createTestRouter(initialEntries: Array<string> = ['/']) {
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

it('renders', () => {
	renderApp()

	expect(true).toBeTruthy()
})

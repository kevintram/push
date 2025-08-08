import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { type RenderOptions, render as rtlRender } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { routeTree } from './routeTree.gen'

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: { gcTime: Number.POSITIVE_INFINITY, retry: false }
	}
})

export function render(
	_ui: ReactElement,
	{
		route = '/',
		...options
	}: Omit<RenderOptions, 'wrapper'> & { route?: string } = {
		reactStrictMode: true
	}
) {
	const memoryHistory = createMemoryHistory({
		initialEntries: [route]
	})

	const router = createRouter({
		routeTree,
		history: memoryHistory
	})

	return {
		user: userEvent.setup(),
		...rtlRender(
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>,
			options
		)
	}
}

// biome-ignore lint: test file
export * from '@testing-library/react'

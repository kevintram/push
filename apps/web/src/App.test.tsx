import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { routeTree } from './routeTree.gen'

// Mock the Supabase client so component hooks stay in-memory during tests.
vi.mock('~/utils/supabase', () => {
	const createMockResponse = () => ({
		data: [],
		error: null,
		count: null,
		status: 200,
		statusText: 'OK'
	})

	const createQueryBuilderMock = () => {
		const response = createMockResponse()
		const builder: Record<string, any> = {
			then: (
				onFulfilled?: (value: typeof response) => unknown,
				onRejected?: (reason: unknown) => unknown
			) => Promise.resolve(response).then(onFulfilled, onRejected),
			catch: (onRejected?: (reason: unknown) => unknown) =>
				Promise.resolve(response).catch(onRejected),
			finally: (onFinally?: () => unknown) =>
				Promise.resolve(response).finally(onFinally)
		}

		const chainableMethods = [
			'abortSignal',
			'contains',
			'eq',
			'filter',
			'gt',
			'gte',
			'ilike',
			'in',
			'is',
			'like',
			'limit',
			'lt',
			'lte',
			'match',
			'maybeSingle',
			'neq',
			'not',
			'or',
			'order',
			'orderBy',
			'overlaps',
			'range',
			'returns',
			'select',
			'single',
			'textSearch',
			'throwOnError'
		] as const

		for (const method of chainableMethods) {
			builder[method] = vi.fn(() => builder)
		}

		const asyncMethods = ['delete', 'insert', 'update', 'upsert'] as const

		for (const method of asyncMethods) {
			builder[method] = vi.fn(async () => response)
		}

		return builder
	}

	const createRealtimeChannelMock = () => {
		const channel: Record<string, any> = {
			on: vi.fn(() => channel),
			subscribe: vi.fn(async () => ({
				data: { subscription: { unsubscribe: vi.fn() } },
				error: null
			})),
			unsubscribe: vi.fn()
		}

		return channel
	}

	return {
		supabase: {
			from: vi.fn(() => createQueryBuilderMock()),
			rpc: vi.fn(async () => ({ data: null, error: null })),
			channel: vi.fn(() => createRealtimeChannelMock()),
			removeChannel: vi.fn(),
			removeAllChannels: vi.fn()
		}
	}
})

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

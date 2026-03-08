import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { routeTree } from '~/app/routeTree.gen'

vi.mock('~/components/SettingsDialog', () => ({
	SettingsDialog: () => null
}))

vi.mock('~/stores/ReviewModeContext', async importOriginal => {
	const actual =
		await importOriginal<typeof import('~/stores/ReviewModeContext')>()

	return {
		...actual,
		useReviewMode: () => ({
			reviewMode: 'off',
			setReviewMode: () => {},
			isReviewModeEnabled: false,
			hidesPrimary: false,
			hidesSecondary: false
		})
	}
})

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

function resolveFetchUrl(input: RequestInfo | URL): string {
	if (typeof input === 'string') return input
	if (input instanceof URL) return input.toString()
	return input.url
}

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json'
		}
	})
}

afterEach(() => {
	vi.restoreAllMocks()
})

describe('detail route not-found handling', () => {
	it('shows not found for missing topic detail route', async () => {
		vi.spyOn(globalThis, 'fetch').mockImplementation(input => {
			const url = resolveFetchUrl(input)

			if (url.includes('/topics/999/')) {
				return Promise.resolve(jsonResponse({ detail: 'Topic not found' }, 404))
			}

			return Promise.resolve(jsonResponse([], 200))
		})

		renderRoute('/topics/999')
		expect(await screen.findByText('Page not found')).toBeInTheDocument()
	})

	it('shows not found for missing review card detail route', async () => {
		vi.spyOn(globalThis, 'fetch').mockImplementation(input => {
			const url = resolveFetchUrl(input)

			if (url.includes('/review-cards/999/')) {
				return Promise.resolve(
					jsonResponse({ detail: 'Review card not found' }, 404)
				)
			}

			if (url.includes('/reviews/')) {
				return Promise.resolve(jsonResponse([], 200))
			}

			return Promise.resolve(jsonResponse([], 200))
		})

		renderRoute('/review-cards/999')
		expect(await screen.findByText('Page not found')).toBeInTheDocument()
	})
})

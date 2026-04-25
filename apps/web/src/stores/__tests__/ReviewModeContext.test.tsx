import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ReviewModeProvider, useReviewMode } from '~/stores/ReviewModeContext'

const storage = new Map<string, string>()

const mockLocalStorage = {
	getItem: (key: string) => storage.get(key) ?? null,
	setItem: (key: string, value: string) => {
		storage.set(key, value)
	},
	removeItem: (key: string) => {
		storage.delete(key)
	},
	clear: () => {
		storage.clear()
	}
}

function Probe() {
	const { reviewMode, hidesSecondary } = useReviewMode()
	const [initiallyHidden] = useState(hidesSecondary)

	return (
		<div>
			<div data-testid='mode'>{reviewMode}</div>
			<div data-testid='hidden'>{String(initiallyHidden)}</div>
		</div>
	)
}

function createTestRouter(initialEntry: string) {
	const rootRoute = createRootRoute({
		component: () => (
			<ReviewModeProvider>
				<Outlet />
			</ReviewModeProvider>
		)
	})

	const practiceRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: 'practice',
		component: Probe
	})

	const reviewFocusRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: 'review/focus',
		component: Probe
	})

	const reviewFocusCardRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: 'review/focus/$reviewCardId',
		component: Probe
	})

	const recentRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: 'recent',
		component: Probe
	})

	const routeTree = rootRoute.addChildren([
		practiceRoute,
		recentRoute,
		reviewFocusRoute,
		reviewFocusCardRoute
	])

	return createRouter({
		routeTree,
		history: createMemoryHistory({ initialEntries: [initialEntry] })
	})
}

function renderRoute(initialEntry: string) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { gcTime: Number.POSITIVE_INFINITY, retry: false }
		}
	})
	const router = createTestRouter(initialEntry)

	return render(
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	)
}

describe('ReviewModeProvider', () => {
	beforeEach(() => {
		storage.clear()
		Object.defineProperty(window, 'localStorage', {
			value: mockLocalStorage,
			writable: true,
			configurable: true
		})
	})

	it('forces review mode on before the first render for practice routes', async () => {
		window.localStorage.setItem('3gulp-flashcard-mode', 'off')

		renderRoute('/practice')

		expect(await screen.findByTestId('mode')).toHaveTextContent('on')
		expect(screen.getByTestId('hidden')).toHaveTextContent('true')
	})

	it('forces review mode on before the first render for review focus routes', async () => {
		window.localStorage.setItem('3gulp-flashcard-mode', 'off')

		renderRoute('/review/focus')

		expect(await screen.findByTestId('mode')).toHaveTextContent('on')
		expect(screen.getByTestId('hidden')).toHaveTextContent('true')
	})

	it('forces review mode on before the first render for focused review cards', async () => {
		window.localStorage.setItem('3gulp-flashcard-mode', 'off')

		renderRoute('/review/focus/42')

		expect(await screen.findByTestId('mode')).toHaveTextContent('on')
		expect(screen.getByTestId('hidden')).toHaveTextContent('true')
	})

	it('uses persisted review mode on non-study routes', async () => {
		window.localStorage.setItem('3gulp-flashcard-mode', 'off')

		renderRoute('/recent')

		expect(await screen.findByTestId('mode')).toHaveTextContent('off')
		expect(screen.getByTestId('hidden')).toHaveTextContent('false')
	})

	it('persists review mode when navigating away from a forced path', async () => {
		window.localStorage.setItem('3gulp-flashcard-mode', 'off')

		renderRoute('/practice')

		expect(await screen.findByTestId('mode')).toHaveTextContent('on')

		// The forced path should have persisted 'on' to localStorage
		expect(window.localStorage.getItem('3gulp-flashcard-mode')).toBe('on')
	})
})

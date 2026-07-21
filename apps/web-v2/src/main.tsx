import './styles/global.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { LoaderPage } from './app/pages/LoaderPage'
import { routeTree } from './app/routeTree.gen'
import { TooltipProvider } from './components/ui'
import { AuthRedirectError } from './utils/apiFetch'

if (import.meta.env.DEV && !import.meta.env.VITEST) {
	const branchLabel = __APP_BRANCH__
	if (branchLabel.length > 0 && !document.title.includes(branchLabel)) {
		document.title = `${document.title} ${branchLabel}`.trim()
	}
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 60_000,
			retry: (failureCount, error) =>
				// only retry 3 times; don't retry at all if auth error
				!(error instanceof AuthRedirectError) && failureCount < 3,
		},
	},
})

const router = createRouter({
	routeTree,
	context: {
		queryClient,
	},

	defaultPreload: 'intent',
	defaultPreloadStaleTime: 0, // let Query decide freshness, not the router

	defaultPendingComponent: LoaderPage,
	defaultPendingMs: 200,
	defaultPendingMinMs: 200,

	scrollRestoration: true,
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

const container = document.querySelector('#root')

if (container) {
	createRoot(container).render(
		<StrictMode>
			<TooltipProvider>
				<QueryClientProvider client={queryClient}>
					<ReactQueryDevtools initialIsOpen={false} />
					<RouterProvider context={{ queryClient }} router={router} />
				</QueryClientProvider>
			</TooltipProvider>
		</StrictMode>,
	)
}

import './styles/global.css'

import {
	MutationCache,
	QueryClient,
	QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'

import { AuthConnectionProbe } from './app/dev/AuthConnectionProbe'
import { LoaderPage } from './app/pages/LoaderPage'
import { routeTree } from './app/routeTree.gen'
import { TooltipProvider } from './components/ui'
import { AuthProvider } from './stores/Auth/AuthProvider'
import { HideModeProvider } from './stores/HideMode'
import { HttpError } from './utils/apiFetch'

if (import.meta.env.DEV && !import.meta.env.VITEST) {
	const branchLabel = __APP_BRANCH__
	if (branchLabel.length > 0 && !document.title.includes(branchLabel)) {
		document.title = `${document.title} ${branchLabel}`.trim()
	}
}

const queryClient = new QueryClient({
	mutationCache: new MutationCache({
		onError: (_error, _variables, _context, mutation) => {
			const message = mutation.meta?.errorMessage

			toast.error(
				typeof message === 'string' ? message : 'Something went wrong',
			)
		},
	}),
	defaultOptions: {
		queries: {
			staleTime: 60_000,
			retry: (failureCount, error) =>
				failureCount < 3 &&
				(error instanceof TypeError || // retry `fetch()` failures
					(error instanceof HttpError && // only retry these HttpErrors
						[408, 429, 500, 502, 503, 504].includes(error.status))),
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
			<AuthProvider>
				<TooltipProvider>
					<HideModeProvider>
						<QueryClientProvider client={queryClient}>
							<ReactQueryDevtools initialIsOpen={false} />
							<RouterProvider
								context={{ queryClient }}
								router={router}
							/>
						</QueryClientProvider>
					</HideModeProvider>
				</TooltipProvider>
				{import.meta.env.DEV && !import.meta.env.VITEST ? (
					<AuthConnectionProbe />
				) : null}
			</AuthProvider>
		</StrictMode>,
	)
}

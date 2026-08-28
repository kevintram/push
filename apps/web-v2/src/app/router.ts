import { createRouter } from '@tanstack/react-router'

import { LoadingIndicator } from '~/components/LoadingIndicator'
import { queryClient } from '~/lib/convex'

import { NotFoundPage } from './pages/NotFoundPage'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
	routeTree,

	context: {
		auth: undefined!,
		queryClient,
	},

	defaultPreload: 'intent',
	defaultPreloadStaleTime: 0,

	defaultNotFoundComponent: NotFoundPage,

	defaultPendingComponent: LoadingIndicator,
	defaultPendingMs: 200,
	defaultPendingMinMs: 200,

	scrollRestoration: true,
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

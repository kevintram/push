import { createRouter } from '@tanstack/react-router'

import { queryClient } from '~/lib/convex'

import { LoadingPage } from './pages/LoadingPage'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
	routeTree,

	context: {
		auth: undefined!,
		queryClient,
	},

	defaultPreload: 'intent',
	defaultPreloadStaleTime: 0,

	defaultPendingComponent: LoadingPage,
	defaultPendingMs: 200,
	defaultPendingMinMs: 200,

	scrollRestoration: true,
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

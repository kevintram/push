import { ConvexQueryClient } from '@convex-dev/react-query'
import { notifyManager, QueryClient } from '@tanstack/react-query'
import { ConvexReactClient } from 'convex/react'

import { config } from './config'

// Convex pushes updates over a socket, so a single change can notify many
// observers at once. Batching to animation frames repaints once per frame
// instead of once per notification.
if (typeof window !== 'undefined') {
	notifyManager.setScheduler(window.requestAnimationFrame)
}

/**
 * The app's single Convex socket. `AuthProvider` attaches the Clerk token to
 * it, and `convexQueryClient` reads through it, so both share one connection.
 */
export const convexClient = new ConvexReactClient(config.convex.url)

const convexQueryClient = new ConvexQueryClient(convexClient)

/**
 * Query client for the whole app. The `convexQuery()` options factory only
 * supplies a `['convexQuery', name, args]` key, so the Convex query function
 * and key hash have to be installed as client-wide defaults for those options
 * to resolve.
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryKeyHashFn: convexQueryClient.hashFn(),
			queryFn: convexQueryClient.queryFn(),
		},
	},
})

// Binds cache subscribe/unsubscribe to Convex socket subscriptions, so mounted
// queries stay live and unmounted ones are torn down after their gc window.
convexQueryClient.connect(queryClient)

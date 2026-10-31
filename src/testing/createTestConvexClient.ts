import { ConvexReactClient } from 'convex/react'

/**
 * A Convex client for tests, with no real socket behind it.
 *
 * `convex/react`'s `useMutation` (aliased as `useConvexMutation`) reads its
 * client from `ConvexProvider` context at render time, even if the mutation
 * is never called. This client only satisfies that context lookup - it never
 * connects to a deployment, since the client's sync connection is lazy and
 * nothing here calls `.mutate()` or subscribes to a query through it.
 */
export function createTestConvexClient() {
	return new ConvexReactClient('https://example.convex.cloud')
}

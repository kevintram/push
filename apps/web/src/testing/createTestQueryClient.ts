import { QueryClient } from '@tanstack/react-query'

/**
 * A QueryClient for tests, with no Convex socket behind it.
 *
 * `convexQuery()` keys are plain serializable values (`['convexQuery', name,
 * args]`), so the default key hashing is enough here and the app's
 * Convex-specific `queryKeyHashFn` is not needed. There is deliberately no
 * default `queryFn`: seed every read a test exercises with `setQueryData`, and
 * anything unseeded fails loudly instead of hanging.
 */
export function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				staleTime: Infinity,
				queryFn: ({ queryKey }) => {
					throw new Error(
						`Unseeded query in test: ${JSON.stringify(queryKey)}`,
					)
				},
			},
		},
	})
}

import { useAuth } from '@workos-inc/authkit-react'
import { useCallback, useMemo } from 'react'

/**
 * Fetches token from Authkit
 */
export function useAuthFromAuthKit() {
	const { isLoading, user, getAccessToken } = useAuth()

	// Convex uses `forceRefreshToken: true` for scheduled refreshes and after a
	// deployment rejects a token. AuthKit otherwise serves its cached token, so
	// preserve that signal here; the client is configured to reuse only the
	// already-fresh initial callback token.
	const fetchAccessToken = useCallback(
		async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
			try {
				return await getAccessToken({ forceRefresh: forceRefreshToken })
			} catch {
				console.error('Unable to fetch WorkOS access token')
				return null
			}
		},
		[getAccessToken],
	)

	return useMemo(
		() => ({
			isLoading,
			isAuthenticated: !isLoading && Boolean(user),
			fetchAccessToken,
		}),
		[fetchAccessToken, isLoading, user],
	)
}

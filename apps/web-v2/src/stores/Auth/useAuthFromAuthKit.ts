import { useAuth } from '@workos-inc/authkit-react'
import { useCallback, useMemo } from 'react'

/**
 * Fetches token from Authkit
 */
export function useAuthFromAuthKit() {
	const { isLoading, user, getAccessToken } = useAuth()

	// Convex passes `forceRefreshToken: true` after a deployment rejects the
	// current token. AuthKit otherwise serves its cached one, so dropping the
	// flag would hand back the same rejected token and leave the client
	// unauthenticated until a reload.
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

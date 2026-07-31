import { useAuth } from '@workos-inc/authkit-react'
import { useCallback, useMemo } from 'react'

/**
 * Fetches token from Authkit
 */
export function useAuthFromAuthKit() {
	const { isLoading, user, getAccessToken } = useAuth()

	const fetchAccessToken = useCallback(async () => {
		try {
			return await getAccessToken()
		} catch {
			console.error('Unable to fetch WorkOS access token')
			return null
		}
	}, [getAccessToken])

	return useMemo(
		() => ({
			isLoading,
			isAuthenticated: !isLoading && Boolean(user),
			fetchAccessToken,
		}),
		[fetchAccessToken, isLoading, user],
	)
}

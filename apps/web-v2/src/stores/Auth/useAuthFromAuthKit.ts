import { useAuth } from '@workos-inc/authkit-react'
import { useCallback, useMemo } from 'react'

/**
 * Hook for adapting AuthKit's `useAuth` to `ConvexProviderWithAuth`'s `useAuth`.
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

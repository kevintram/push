import { RouterProvider } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import { useEffect, useMemo, useRef } from 'react'

import { router } from './router'

export function AuthedRouterProvider() {
	const { isAuthenticated, isLoading } = useConvexAuth()
	const auth = useMemo(
		() => ({ isAuthenticated, isLoading }),
		[isAuthenticated, isLoading],
	)
	const previousAuth = useRef(auth)

	useEffect(() => {
		if (
			previousAuth.current.isAuthenticated === auth.isAuthenticated &&
			previousAuth.current.isLoading === auth.isLoading
		) {
			return
		}

		previousAuth.current = auth
		void router.invalidate() // so loaders rerun
	}, [auth])

	return <RouterProvider context={{ auth }} router={router} />
}

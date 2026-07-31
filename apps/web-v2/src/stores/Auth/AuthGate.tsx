import { useAuth } from '@workos-inc/authkit-react'
import { useConvexAuth } from 'convex/react'
import { type ReactNode, useCallback, useEffect, useState } from 'react'

import { AuthFailedPage } from '~/app/pages/AuthFailedPage'
import { NotAuthenticatedPage } from '~/app/pages/NotAuthenticatedPage'

import { getCurrentReturnTo } from './authRedirect'

type AuthGateProps = {
	children: ReactNode
}

const AUTH_PENDING_VISIBLE_AFTER_MS = 500

/**
 * Holds the router outside the tree until Convex has accepted the WorkOS
 * session. TanStack Router starts loaders when its provider mounts, so this
 * keeps protected loader queries from racing the initial token exchange.
 */
export function AuthGate({ children }: AuthGateProps) {
	const { isLoading: isWorkOsLoading, signIn, user } = useAuth()
	const {
		isAuthenticated: isConvexAuthenticated,
		isLoading: isConvexLoading,
	} = useConvexAuth()

	const [signInFailed, setSignInFailed] = useState(false)
	const isWorkOsAuthenticated = Boolean(user)
	const isAuthPending =
		isWorkOsLoading ||
		isConvexLoading ||
		!isWorkOsAuthenticated ||
		!isConvexAuthenticated
	const startSignIn = useCallback(
		() =>
			signIn({
				state: { returnTo: getCurrentReturnTo() },
			}),
		[signIn],
	)

	useEffect(() => {
		// Automatically begin sign-in once WorkOS has confirmed there is no
		// current user. A rejected attempt is latched so this effect doesn't turn
		// a transient or configuration error into an infinite redirect loop.
		if (isWorkOsLoading || isWorkOsAuthenticated || signInFailed) {
			return
		}

		void startSignIn().catch(() => setSignInFailed(true))
	}, [isWorkOsAuthenticated, isWorkOsLoading, signInFailed, startSignIn])

	const handleRetrySignIn = useCallback(() => {
		// A user-initiated retry is allowed without waiting for another auth state
		// transition. Reset the failure latch before starting that new attempt.
		setSignInFailed(false)

		void startSignIn().catch(() => setSignInFailed(true))
	}, [startSignIn])

	// A WorkOS failure is actionable. All other incomplete states—including the
	// short handoff from WorkOS to Convex—continue to use the pending screen.
	if (!isWorkOsAuthenticated && signInFailed) {
		return <AuthFailedPage onRetry={() => setSignInFailed(false)} />
	}

	if (isAuthPending) {
		return (
			<NotAuthenticatedPage
				delayMs={AUTH_PENDING_VISIBLE_AFTER_MS}
				onRetry={handleRetrySignIn}
			/>
		)
	}

	return children
}

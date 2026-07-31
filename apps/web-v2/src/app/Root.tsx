import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet } from '@tanstack/react-router'
import { useAuth } from '@workos-inc/authkit-react'
import { useConvexAuth } from 'convex/react'
import { useCallback, useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { AuthFailedPage } from '~/app/pages/AuthFailedPage'
import { ErrorPage } from '~/app/pages/ErrorPage'
import { NotAuthenticatedPage } from '~/app/pages/NotAuthenticatedPage'
import { AppShell } from '~/components/AppShell'
import { Toaster } from '~/components/ui'

const showDevtools = import.meta.env.DEV && !import.meta.env.VITEST

export function Root() {
	const { isLoading: isWorkOsLoading, signIn, user } = useAuth()
	const {
		isAuthenticated: isConvexAuthenticated,
		isLoading: isConvexLoading,
	} = useConvexAuth()

	const [signInFailed, setSignInFailed] = useState(false)
	const isWorkOsAuthenticated = Boolean(user)
	// WorkOS establishes the user identity first, then Convex observes that
	// identity and establishes its own session. The app isn't ready until both
	// sides agree that the user is authenticated.
	const isAuthPending =
		isWorkOsLoading ||
		isConvexLoading ||
		!isWorkOsAuthenticated ||
		!isConvexAuthenticated

	useEffect(() => {
		// Automatically begin sign-in once WorkOS has confirmed there is no
		// current user. A rejected attempt is latched so this effect doesn't turn
		// a transient or configuration error into an infinite redirect loop.
		if (isWorkOsLoading || isWorkOsAuthenticated || signInFailed) {
			return
		}

		void signIn().catch(() => setSignInFailed(true))
	}, [isWorkOsAuthenticated, isWorkOsLoading, signIn, signInFailed])

	const handleRetrySignIn = useCallback(() => {
		// A user-initiated retry is allowed without waiting for another auth state
		// transition. Reset the failure latch before starting that new attempt.
		setSignInFailed(false)

		void signIn().catch(() => setSignInFailed(true))
	}, [signIn])

	// A WorkOS failure is actionable. All other incomplete states—including the
	// short handoff from WorkOS to Convex—continue to use the pending screen.
	if (!isWorkOsAuthenticated && signInFailed) {
		return <AuthFailedPage onRetry={() => setSignInFailed(false)} />
	}

	if (isAuthPending) {
		return <NotAuthenticatedPage onRetry={handleRetrySignIn} />
	}

	return (
		<>
			<AppShell>
				<ErrorBoundary FallbackComponent={ErrorPage}>
					<Outlet />
				</ErrorBoundary>
			</AppShell>
			<Toaster />
			{showDevtools && <ReactQueryDevtools />}
		</>
	)
}

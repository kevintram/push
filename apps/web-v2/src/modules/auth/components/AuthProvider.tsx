import type { AnyRouter } from '@tanstack/react-router'
import { AuthKitProvider } from '@workos-inc/authkit-react'
import { ConvexProviderWithAuth } from 'convex/react'
import type { ReactNode } from 'react'

import { config } from '~/lib/config'
import { convexClient } from '~/lib/convex'

import { useAuthFromAuthKit } from '../hooks/useAuthFromAuthKit'

type AuthProviderProps = {
	children: ReactNode
	router: AnyRouter
}

const defaultReturnTo = '/'

function getSafeReturnTo(state: unknown) {
	// `state` completes a round trip through AuthKit and is *untrusted* at this
	// boundary. Fail closed when it does not have the exact shape we expect.
	if (
		typeof state !== 'object' ||
		state === null ||
		!('returnTo' in state) ||
		typeof state.returnTo !== 'string'
	) {
		return defaultReturnTo
	}

	try {
		// Resolve relative destinations against our origin so relative and absolute
		// same-origin URLs can go through the same validation path.
		const returnToUrl = new URL(state.returnTo, window.location.origin)

		// Hand TanStack Router only an application-local location. Besides blocking
		// open redirects, stripping the origin keeps this an in-app navigation.
		return returnToUrl.origin === window.location.origin
			? `${returnToUrl.pathname}${returnToUrl.search}${returnToUrl.hash}`
			: defaultReturnTo
	} catch {
		// URL parsing can reject malformed input, which is equivalent to any other
		// invalid return destination.
		return defaultReturnTo
	}
}

async function redirectToReturnTo(router: AnyRouter, state: unknown) {
	// AuthKit can finish its callback while TanStack Router is still committing
	// the redirect URI's initial route. Finish that load first so it cannot
	// overwrite the restored destination's matches after navigation.
	await router.load()

	await router.navigate({
		to: getSafeReturnTo(state),
		replace: true,
	})
}

export function AuthProvider({ children, router }: AuthProviderProps) {
	return (
		<AuthKitProvider
			clientId={config.workOs.clientId}
			onRedirectCallback={({ state }) => {
				void redirectToReturnTo(router, state)
			}}
			onRefreshFailure={({ signIn }) => {
				void signIn({
					state: {
						returnTo: router.state.location.href,
					},
				})
			}}
			redirectUri={config.workOs.redirectUri}
		>
			<ConvexProviderWithAuth
				client={convexClient}
				useAuth={useAuthFromAuthKit}
			>
				{children}
			</ConvexProviderWithAuth>
		</AuthKitProvider>
	)
}

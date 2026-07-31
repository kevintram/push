import { AuthKitProvider } from '@workos-inc/authkit-react'
import { ConvexProviderWithAuth } from 'convex/react'
import type { ReactNode } from 'react'

import { config } from '~/lib/config'
import { convexClient } from '~/lib/convex'

import { getCurrentReturnTo, redirectToReturnTo } from './authRedirect'
import { useAuthFromAuthKit } from './useAuthFromAuthKit'

type AuthProviderProps = {
	children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
	return (
		<AuthKitProvider
			clientId={config.workOs.clientId}
			onRedirectCallback={({ state }) => redirectToReturnTo(state)}
			onRefreshFailure={({ signIn }) => {
				void signIn({
					state: { returnTo: getCurrentReturnTo() },
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

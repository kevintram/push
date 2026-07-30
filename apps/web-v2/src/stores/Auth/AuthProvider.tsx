import { AuthKitProvider } from '@workos-inc/authkit-react'
import { ConvexProviderWithAuth } from 'convex/react'
import type { ComponentProps, ReactNode } from 'react'

import { config } from '~/lib/config'
import { convexClient } from '~/lib/convex'

import { useAuthFromAuthKit } from './useAuthFromAuthKit'

type AuthProviderProps = {
	children: ReactNode
	onRedirectCallback?: ComponentProps<
		typeof AuthKitProvider
	>['onRedirectCallback']
}

export function AuthProvider({
	children,
	onRedirectCallback,
}: AuthProviderProps) {
	return (
		<AuthKitProvider
			clientId={config.workOs.clientId}
			onRedirectCallback={onRedirectCallback}
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

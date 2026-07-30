import { AuthKitProvider } from '@workos-inc/authkit-react'
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import type { ComponentProps, ReactNode } from 'react'

import { readPublicAuthConfig } from './authConfig'
import { useAuthFromAuthKit } from './useAuthFromAuthKit'

const authConfig = readPublicAuthConfig({
	VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
	VITE_WORKOS_CLIENT_ID: import.meta.env.VITE_WORKOS_CLIENT_ID,
	VITE_WORKOS_REDIRECT_URI: import.meta.env.VITE_WORKOS_REDIRECT_URI,
})
const convexClient = new ConvexReactClient(authConfig.convexUrl)

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
			clientId={authConfig.workOsClientId}
			onRedirectCallback={onRedirectCallback}
			redirectUri={authConfig.workOsRedirectUri}
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

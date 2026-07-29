import { AuthKitProvider } from '@workos-inc/authkit-react'
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import type { ReactNode } from 'react'

import { useAuthFromAuthKit } from './useAuthFromAuthKit'

const convexClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

type AuthProviderProps = {
	children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
	return (
		<AuthKitProvider
			clientId={import.meta.env.VITE_WORKOS_CLIENT_ID}
			redirectUri={import.meta.env.VITE_WORKOS_REDIRECT_URI}
		>
			{/*  */}
			<ConvexProviderWithAuth
				client={convexClient}
				useAuth={useAuthFromAuthKit}
			>
				{children}
			</ConvexProviderWithAuth>
		</AuthKitProvider>
	)
}

import { ClerkProvider, useAuth } from '@clerk/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import type { ReactNode } from 'react'

import { config } from '~/lib/config'
import { convexClient } from '~/lib/convex'

type AuthProviderProps = {
	children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
	return (
		<ClerkProvider
			afterSignOutUrl='/'
			publishableKey={config.clerk.publishableKey}
		>
			<ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
				{children}
			</ConvexProviderWithClerk>
		</ClerkProvider>
	)
}

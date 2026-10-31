import { HotkeysProvider } from '@tanstack/react-hotkeys'
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'

import { AppShell } from '~/app/layout/AppShell'
import { ErrorPage } from '~/app/pages/ErrorPage'
import { NotFoundPage } from '~/app/pages/NotFoundPage'
import { AuthGate } from '~/modules/auth/components/AuthGate'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'

export type RouterContext = {
	auth: {
		isAuthenticated: boolean
		isLoading: boolean
	}
	queryClient: QueryClient
}
export const Route = createRootRouteWithContext<RouterContext>()({
	notFoundComponent: NotFoundPage,
	component: () => (
		<HotkeysProvider appHotkeys={appHotkeys}>
			<AuthGate>
				<AppShell>
					<ErrorBoundary FallbackComponent={ErrorPage}>
						<Outlet />
					</ErrorBoundary>
				</AppShell>
			</AuthGate>
		</HotkeysProvider>
	),
})

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'

import { ErrorPage } from '~/app/pages/ErrorPage'
import { AppShell } from '~/components/AppShell'
import { Toaster } from '~/components/ui'

const showDevtools = import.meta.env.DEV && !import.meta.env.VITEST

export function Root() {
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

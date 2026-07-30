import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

import { NotFoundPage } from '~/app/pages/NotFoundPage'
import { AppShell } from '~/components/AppShell'
import { Toaster } from '~/components/ui'

export type RouterContext = {
	queryClient: QueryClient
}

const showDevtools = import.meta.env.DEV && !import.meta.env.VITEST

function renderError({ error }: FallbackProps) {
	return (
		<div role='alert'>
			<h1>Something went wrong</h1>
			<pre>{error instanceof Error ? error.message : String(error)}</pre>
		</div>
	)
}

export const Route = createRootRouteWithContext<RouterContext>()({
	notFoundComponent: NotFoundPage,
	component: () => (
		<>
			<AppShell>
				<ErrorBoundary fallbackRender={renderError}>
					<Outlet />
				</ErrorBoundary>
			</AppShell>
			<Toaster />
			{showDevtools && <ReactQueryDevtools />}
		</>
	),
})

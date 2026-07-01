import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

import { AppShell } from '~/components/AppShell'

export type RouterContext = {
	queryClient: QueryClient
}

function renderError({ error }: FallbackProps) {
	return (
		<div role='alert'>
			<h1>Something went wrong</h1>
			<pre>{error instanceof Error ? error.message : String(error)}</pre>
		</div>
	)
}

function NotFoundView() {
	return (
		<div>
			<h1>Page not found</h1>
		</div>
	)
}

export const Route = createRootRouteWithContext<RouterContext>()({
	notFoundComponent: NotFoundView,
	component: () => (
		<AppShell>
			<ErrorBoundary fallbackRender={renderError}>
				<Outlet />
			</ErrorBoundary>
		</AppShell>
	),
})

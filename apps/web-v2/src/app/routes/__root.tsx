import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

import { NotFoundPage } from '~/app/pages/NotFoundPage'
import { AppShell } from '~/components/AppShell'
import { Toaster } from '~/components/ui'

function renderError({ error }: FallbackProps) {
	return (
		<div role='alert'>
			<h1>Something went wrong</h1>
			<pre>{error instanceof Error ? error.message : String(error)}</pre>
		</div>
	)
}

export const Route = createRootRoute({
	notFoundComponent: NotFoundPage,
	component: () => (
		<>
			<AppShell>
				<ErrorBoundary fallbackRender={renderError}>
					<Outlet />
				</ErrorBoundary>
			</AppShell>
			<Toaster />
		</>
	),
})

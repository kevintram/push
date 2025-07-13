import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { LoadingOrError } from 'components/LoadingOrError'
import { Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

function renderError({ error }: FallbackProps) {
	return <LoadingOrError error={error} />
}

export const Route = createRootRoute({
	component: () => (
		<ErrorBoundary fallbackRender={renderError}>
			<Suspense fallback={<LoadingOrError />}>
				<Outlet />
			</Suspense>
			{import.meta.env.DEV && !import.meta.env.VITEST && (
				<TanStackRouterDevtools />
			)}
		</ErrorBoundary>
	)
})

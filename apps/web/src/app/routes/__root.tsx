import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { LoadingOrError } from '~/components/LoadingOrError'
import { Toaster } from '~/components/ui/sonner'
import { ReviewDialogProvider } from '~/features/reviews/providers/ReviewDialogProvider'

function renderError({ error }: FallbackProps) {
	return <LoadingOrError error={error} />
}

function NotFoundView() {
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<h1 className='text-xl'>Page not found</h1>
		</div>
	)
}

export const Route = createRootRoute({
	notFoundComponent: NotFoundView,
	component: () => (
		<ErrorBoundary fallbackRender={renderError}>
			<ReviewDialogProvider>
				<Suspense fallback={<LoadingOrError />}>
					<Outlet />
				</Suspense>
				<Toaster />
			</ReviewDialogProvider>
		</ErrorBoundary>
	)
})

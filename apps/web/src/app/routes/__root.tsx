import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { LoadingOrError } from '~/components/LoadingOrError'
import { Toaster } from '~/components/ui/sonner'
import { ReviewSessionTopicDialogProvider } from '~/features/dialogs/providers/ReviewSessionTopicDialogProvider'
import { ReviewDialogProvider } from '~/features/reviews/providers/ReviewDialogProvider'

function renderError({ error }: FallbackProps) {
	return <LoadingOrError error={error} />
}

export const Route = createRootRoute({
	component: () => (
		<ErrorBoundary fallbackRender={renderError}>
			<ReviewSessionTopicDialogProvider>
				<ReviewDialogProvider>
					<Suspense fallback={<LoadingOrError />}>
						<Outlet />
					</Suspense>
					<Toaster />
				</ReviewDialogProvider>
			</ReviewSessionTopicDialogProvider>
		</ErrorBoundary>
	)
})

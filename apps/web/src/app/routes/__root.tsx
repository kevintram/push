import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { LoadingOrError } from '~/components/LoadingOrError'
import { Toaster } from '~/components/ui/sonner'
import { TopicDialogProvider } from '~/features/dialogs/providers/TopicDialogProvider'
import { ReviewDialogProvider } from '~/features/reviews/providers/ReviewDialogProvider'

function renderError({ error }: FallbackProps) {
	return <LoadingOrError error={error} />
}

export const Route = createRootRoute({
	component: () => (
		<ErrorBoundary fallbackRender={renderError}>
			<TopicDialogProvider>
				<ReviewDialogProvider>
					<Suspense fallback={<LoadingOrError />}>
						<Outlet />
					</Suspense>
					<Toaster />
				</ReviewDialogProvider>
			</TopicDialogProvider>
		</ErrorBoundary>
	)
})

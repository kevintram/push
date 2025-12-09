import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { LoadingOrError } from '~/components/LoadingOrError'
import { ReviewTopicDialogProvider } from '~/features/dialogs/providers/ReviewTopicDialogProvider'

function renderError({ error }: FallbackProps) {
	return <LoadingOrError error={error} />
}

export const Route = createRootRoute({
	component: () => (
		<ErrorBoundary fallbackRender={renderError}>
			<ReviewTopicDialogProvider>
				<Suspense fallback={<LoadingOrError />}>
					<Outlet />
				</Suspense>
			</ReviewTopicDialogProvider>
		</ErrorBoundary>
	)
})
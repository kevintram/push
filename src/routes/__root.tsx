import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { AppSidebar } from '~/components/AppSidebar'
import { LoadingOrError } from '~/components/LoadingOrError'
import { SidebarProvider, SidebarTrigger } from '~/components/ui/Sidebar'

function renderError({ error }: FallbackProps) {
	return <LoadingOrError error={error} />
}

export const Route = createRootRoute({
	component: () => (
		<ErrorBoundary fallbackRender={renderError}>
			<SidebarProvider>
				<Suspense fallback={<LoadingOrError />}>
						<AppSidebar/>
						<SidebarTrigger />
						<Outlet />
				</Suspense>
			</SidebarProvider>
		</ErrorBoundary>
	)
})

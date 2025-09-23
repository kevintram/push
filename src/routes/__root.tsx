import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { AppSidebar } from '~/components/AppSidebar'
import { Header } from '~/components/Header'
import { LoadingOrError } from '~/components/LoadingOrError'
import { SidebarInset, SidebarProvider } from '~/components/ui/Sidebar'

function renderError({ error }: FallbackProps) {
	return <LoadingOrError error={error} />
}

export const Route = createRootRoute({
	component: () => (
		<ErrorBoundary fallbackRender={renderError}>
			<SidebarProvider defaultOpen={false}>
				<AppSidebar />
				<SidebarInset>
					<Header />
					<div className='flex-1'>
						<Suspense fallback={<LoadingOrError />}>
							<Outlet />
						</Suspense>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</ErrorBoundary>
	)
})

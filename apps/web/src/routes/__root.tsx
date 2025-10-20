import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { AppSidebar } from '~/components/AppSidebar'
import { Header } from '~/components/Header'
import { LoadingOrError } from '~/components/LoadingOrError'
import { SidebarProvider } from '~/components/ui/Sidebar'

function renderError({ error }: FallbackProps) {
	return <LoadingOrError error={error} />
}

export const Route = createRootRoute({
	component: () => (
		<ErrorBoundary fallbackRender={renderError}>
			<SidebarProvider className='h-svh' defaultOpen={false}>
				<AppSidebar />
				<div className='relative flex min-h-0 flex-1 flex-col bg-background'>
					<Header />
					<div className='relative min-h-0 flex-1 rounded-tl-sm border-1 bg-primary-foreground'>
						<Suspense fallback={<LoadingOrError />}>
							<Outlet />
						</Suspense>
					</div>
				</div>
			</SidebarProvider>
		</ErrorBoundary>
	)
})

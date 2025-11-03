import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { AppSidebar } from '~/components/AppSidebar'
import { Header } from '~/components/Header'
import { LoadingOrError } from '~/components/LoadingOrError'
import { SidebarHolder, SidebarProvider } from '~/components/ui/Sidebar'
import { TopicDialogProvider } from '~/features/topics/providers/TopicDialogProvider'

function renderError({ error }: FallbackProps) {
	return <LoadingOrError error={error} />
}

export const Route = createRootRoute({
	component: () => (
		<ErrorBoundary fallbackRender={renderError}>
			<TopicDialogProvider>
				<SidebarProvider defaultOpen={false}>
					<SidebarHolder className='!bg-background h-svh'>
						<AppSidebar />
						<div className='relative ml-1 flex min-h-0 flex-1 flex-col bg-background'>
							<Header />
							<div className='relative min-h-0 flex-1 rounded-tl-sm border-1 bg-primary-foreground'>
								<Suspense fallback={<LoadingOrError />}>
									<Outlet />
								</Suspense>
							</div>
						</div>
					</SidebarHolder>
				</SidebarProvider>
			</TopicDialogProvider>
		</ErrorBoundary>
	)
})

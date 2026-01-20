import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppSidebar } from '~/app/components/AppSidebar/AppSidebar'
import {
	SIDEBAR_COOKIE_NAME,
	SidebarHolder,
	SidebarProvider
} from '~/components/ui/Sidebar'

export const Route = createFileRoute('/_main')({
	component: MainLayout
})

function MainLayout() {
	return (
		<SidebarProvider cookieName={SIDEBAR_COOKIE_NAME} width='12rem'>
			<SidebarHolder className='!bg-primary-foreground h-svh'>
				<AppSidebar />
				<div className='relative ml-1 flex min-h-0 min-w-0 flex-1 flex-col bg-primary-foreground'>
					<div className='relative min-h-0 min-w-0 flex-1 border-1 bg-background'>
						<Outlet />
					</div>
				</div>
			</SidebarHolder>
		</SidebarProvider>
	)
}

import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Header } from '~/app/components/AppHeader'
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
			<SidebarHolder className='!bg-background h-svh'>
				<AppSidebar />
				<div className='relative ml-1 flex min-h-0 min-w-0 flex-1 flex-col bg-background'>
					<Header />
					<div className='relative min-h-0 min-w-0 flex-1 rounded-tl-sm border-1 bg-primary-foreground'>
						<Outlet />
					</div>
				</div>
			</SidebarHolder>
		</SidebarProvider>
	)
}

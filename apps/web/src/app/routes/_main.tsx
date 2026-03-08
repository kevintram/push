import { createFileRoute, Outlet } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { AppSidebar } from '~/app/components/AppSidebar/AppSidebar'
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'

export const Route = createFileRoute('/_main')({
	component: MainLayout
})

function MainLayout() {
	return (
		<SidebarProvider
			style={
				{
					'--sidebar-width': '12rem'
				} as CSSProperties
			}
		>
			<AppSidebar />
			<SidebarInset className='!bg-primary-foreground h-svh md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none'>
				<div className='relative ml-1 flex min-h-0 min-w-0 flex-1 flex-col bg-primary-foreground'>
					<div className='relative min-h-0 min-w-0 flex-1 bg-background'>
						<Outlet />
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}

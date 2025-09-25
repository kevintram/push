import { Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
	Inbox,
	ListChecks,
	Logs,
	RotateCcw,
	Settings,
	SquareLibrary,
	Trash2
} from 'lucide-react'

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem
} from '~/components/ui/Sidebar'

export function AppSidebar() {
	const menuItems = [
		{
			title: 'Inbox',
			url: '/inbox',
			icon: Inbox
		},
		{
			title: 'Todo',
			url: '/',
			icon: ListChecks
		},
		{
			title: 'Library',
			url: '/topics',
			icon: SquareLibrary
		},
		{
			title: 'Review',
			url: '/review',
			icon: RotateCcw
		},
		{
			title: 'Logbook',
			url: '/logbook',
			icon: Logs
		},
		{
			title: 'Trash',
			url: '/trash',
			icon: Trash2
		}
	]

	return (
		<Sidebar className='z-20' collapsible='icon'>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{menuItems.map(item => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild={true} tooltip={item.title}>
										<Link to={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarContent>
					<SidebarGroup>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild={true} tooltip='Settings'>
									<Link to='/settings'>
										<Settings />
										<span>Settings</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							{import.meta.env.DEV && !import.meta.env.VITEST && (
								<SidebarMenuItem>
									<SidebarMenuButton asChild={true}>
										<TanStackRouterDevtools
											toggleButtonProps={{
												style: {
													position: 'static'
												}
											}}
										/>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}
						</SidebarMenu>
					</SidebarGroup>
				</SidebarContent>
			</SidebarFooter>
		</Sidebar>
	)
}

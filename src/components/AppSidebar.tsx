import { Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Archive, Settings, SquareLibrary } from 'lucide-react'

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
	return (
		<>
			<Sidebar>
				<NavigationMain />
				<Footer />
			</Sidebar>
		</>
	)
}

const navigationItems = [
	{
		title: 'Library',
		url: '/',
		icon: SquareLibrary
	},
	{
		title: 'Archive',
		url: '/archive',
		icon: Archive
	}
]

function NavigationMain() {
	return (
		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupContent>
					<SidebarMenu>
						{navigationItems.map(item => (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton asChild={true}>
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
	)
}

function Footer() {
	return (
		<SidebarFooter>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild={true}>
								<Link to='/settings'>
									<Settings /> {/* (the settings icon) */}
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
	)
}

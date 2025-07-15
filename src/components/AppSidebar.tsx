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
		url: '#',
		icon: SquareLibrary
	},
	{
		title: 'Archive',
		url: '#',
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
									<a href={item.url}>
										<item.icon />
										<span>{item.title}</span>
									</a>
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
								{/* biome-ignore lint: temporary, TODO: remove this */}
								<a href='#'>
									<Settings />
									<span>Settings</span>
								</a>
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

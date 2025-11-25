import { Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
	History,
	Inbox,
	ListChecks,
	Settings,
	SquareLibrary
} from 'lucide-react'
import { useState } from 'react'

import { CreateButton } from '~/components/AppSidebar/CreateButton'
import { SettingsDialog } from '~/components/SettingsDialog'
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
	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)

	const menuItems = [
		{
			title: 'Inbox',
			url: '/inbox',
			icon: Inbox
		},
		{
			title: 'Review',
			url: '/',
			icon: ListChecks
		},
		{
			title: 'Recent',
			url: '/recent',
			icon: History
		},
		{
			title: 'Topics',
			url: '/topics',
			icon: SquareLibrary
		}
	]

	return (
		<Sidebar
			className='!border-0 z-20 bg-background'
			collapsible='icon'
			variant='inset'
		>
			<SidebarContent className='bg-background'>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<CreateButton />
							</SidebarMenuItem>
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
			<SidebarFooter className='bg-background'>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => setIsSettingsDialogOpen(true)}
							tooltip='Settings'
						>
							<Settings />
							<span>Settings</span>
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
			</SidebarFooter>
			<SettingsDialog
				onOpenChange={setIsSettingsDialogOpen}
				open={isSettingsDialogOpen}
			/>
		</Sidebar>
	)
}

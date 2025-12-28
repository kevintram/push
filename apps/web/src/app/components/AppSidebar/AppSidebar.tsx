import { Link, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
	Archive,
	Calendar,
	CircleDashed,
	History,
	Home,
	Inbox,
	ListChecks,
	RotateCw,
	Settings
} from 'lucide-react'
import { useState } from 'react'

import { CreateButton } from '~/app/components/AppSidebar/CreateButton'
import { SettingsDialog } from '~/components/SettingsDialog'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem
} from '~/components/ui/Sidebar'

export function AppSidebar() {
	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
	const location = useLocation()

	const reviewItems = [
		{
			title: 'Ready',
			url: '/ready',
			icon: RotateCw,
			isActive: (pathname: string) => pathname === '/ready'
		},
		{
			title: 'Scheduled',
			url: '/scheduled',
			icon: Calendar,
			isActive: (pathname: string) => pathname === '/scheduled'
		},
		{
			title: 'Unscheduled',
			url: '/unscheduled',
			icon: CircleDashed,
			isActive: (pathname: string) => pathname === '/unscheduled'
		},
		{
			title: 'Logbook',
			url: '/logbook',
			icon: ListChecks,
			isActive: (pathname: string) => pathname === '/logbook'
		}
	]

	const topicItems = [
		{
			title: 'Home',
			url: '/home',
			icon: Home,
			isActive: (pathname: string) => pathname === '/home'
		},
		{
			title: 'Inbox',
			url: '/inbox',
			icon: Inbox,
			isActive: (pathname: string) => pathname === '/inbox'
		},
		{
			title: 'Recent',
			url: '/recent',
			icon: History,
			isActive: (pathname: string) => pathname === '/recent'
		},
		{
			title: 'Archived',
			url: '/archived',
			icon: Archive,
			isActive: (pathname: string) => pathname === '/archived'
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
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel>Review</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{reviewItems.map(item => {
								const isActive = item.isActive(location.pathname)
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											asChild={true}
											isActive={isActive}
											tooltip={item.title}
										>
											<Link to={item.url}>
												<item.icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel>Topics</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{topicItems.map(item => {
								const isActive = item.isActive(location.pathname)
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											asChild={true}
											isActive={isActive}
											tooltip={item.title}
										>
											<Link to={item.url}>
												<item.icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)
							})}
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

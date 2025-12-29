import { Link, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
	Archive,
	BookOpen,
	Calendar,
	CircleDashed,
	History,
	Home,
	Inbox,
	LayoutGrid,
	ListChecks,
	Settings,
	Star
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
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem
} from '~/components/ui/Sidebar'
import { useTopics } from '~/features/topics/api/getTopics'

export function AppSidebar() {
	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
	const location = useLocation()

	const { data: inboxTopics } = useTopics({ inboxed: true, archived: false })
	const inboxCount = inboxTopics?.length ?? 0

	const topItems = [
		{
			title: 'Home',
			url: '/overview',
			icon: LayoutGrid,
			isActive: (pathname: string) => pathname === '/overview'
		},
		{
			title: 'Review',
			url: '/review',
			icon: BookOpen,
			isActive: (pathname: string) => pathname === '/review'
		}
	]

	const scheduleItems = [
		{
			title: 'Today',
			url: '/today',
			icon: Star,
			isActive: (pathname: string) => pathname === '/today'
		},
		{
			title: 'Upcoming',
			url: '/upcoming',
			icon: Calendar,
			isActive: (pathname: string) => pathname === '/upcoming'
		},
		{
			title: 'Unscheduled',
			url: '/unscheduled',
			icon: CircleDashed,
			isActive: (pathname: string) => pathname === '/unscheduled'
		}
	]

	const topicItems = [
		{
			title: 'Inbox',
			url: '/inbox',
			icon: Inbox,
			isActive: (pathname: string) => pathname === '/inbox'
		},
		{
			title: 'My topics',
			url: '/home',
			icon: Home,
			isActive: (pathname: string) => pathname === '/home'
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
					<SidebarGroupContent>
						<SidebarMenu>
							{topItems.map(item => {
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
					<SidebarGroupLabel>Schedule</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{scheduleItems.map(item => {
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
								const isInbox = item.title === 'Inbox'
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
										{isInbox && inboxCount > 0 && (
											<SidebarMenuBadge>{inboxCount}</SidebarMenuBadge>
										)}
									</SidebarMenuItem>
								)
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Logbook at the bottom of the content area */}
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild={true}
									isActive={location.pathname === '/logbook'}
									tooltip='Logbook'
								>
									<Link to='/logbook'>
										<ListChecks />
										<span>Logbook</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
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

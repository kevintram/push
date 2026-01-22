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
	Library,
	ListChecks,
	PanelLeft,
	Settings,
	Star
} from 'lucide-react'
import { useState } from 'react'

import { CreateButton } from '~/app/components/AppSidebar/CreateButton'
import { SidebarSearch } from '~/app/components/AppSidebar/SidebarSearch'
import { SettingsDialog } from '~/components/SettingsDialog'
import { Button } from '~/components/ui/Button'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar
} from '~/components/ui/Sidebar'
import { useTopics } from '~/features/topics/api/getTopics'

export function AppSidebar() {
	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
	const location = useLocation()
	const { toggleSidebar } = useSidebar()

	const { data: inboxTopics } = useTopics({ inboxed: true, archived: false })
	const inboxCount = inboxTopics?.length ?? 0

	const topItems = [
		{
			title: 'Home',
			url: '/home',
			icon: Home,
			isActive: (pathname: string) => pathname === '/home'
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

	const libraryItems = [
		{
			title: 'Inbox',
			url: '/inbox',
			icon: Inbox,
			isActive: (pathname: string) => pathname === '/inbox'
		},
		{
			title: 'My Library',
			url: '/my-library',
			icon: Library,
			isActive: (pathname: string) => pathname === '/my-library'
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
			className='!border-0 z-20 bg-primary-foreground'
			collapsible='icon'
			variant='inset'
		>
			<SidebarHeader className='bg-primary-foreground'>
				<SidebarMenu>
					<SidebarMenuItem>
						<Button
							className='-ml-0.5'
							onClick={toggleSidebar}
							size='icon'
							variant='ghost'
						>
							<PanelLeft />
							<span className='sr-only'>Toggle Sidebar</span>
						</Button>
					</SidebarMenuItem>
					<SidebarSearch />
					<SidebarMenuItem>
						<CreateButton />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className='bg-primary-foreground'>
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
					<SidebarGroupLabel>Library</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{libraryItems.map(item => {
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

			<SidebarFooter className='bg-primary-foreground'>
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

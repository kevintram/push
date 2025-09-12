import { Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
	CalendarDays,
	Logs,
	RotateCcw,
	Settings,
	SquareLibrary,
	Star,
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
	const firstGroup = [
		{
			title: 'Today',
			url: '/',
			icon: Star
		},
		{
			title: 'Upcoming',
			url: '/upcoming',
			icon: CalendarDays
		}
	]

	const secondGroup = [
		{
			title: 'Review',
			url: '/review',
			icon: RotateCcw
		},
		{
			title: 'Library',
			url: '/topics',
			icon: SquareLibrary
		}
	]

	const thirdGroup = [
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
		<Sidebar collapsible='icon'>
			<SidebarContent>
				{/* First Group (Today, Upcoming) */}
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{firstGroup.map(item => (
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
				{/* Second Group (Review, Library) */}
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{secondGroup.map(item => (
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
				{/* Third Group (Logbook, Trash) */}
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{thirdGroup.map(item => (
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

import { Link, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
	Clock,
	Layers,
	Library,
	ListChecks,
	PanelLeft,
	Settings
} from 'lucide-react'
import { useState } from 'react'

import { SidebarSearch } from '~/app/components/AppSidebar/SidebarSearch'
import { SettingsDialog } from '~/components/SettingsDialog'
import { Button } from '~/components/ui/button'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar
} from '~/components/ui/sidebar'

export function AppSidebar() {
	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
	const location = useLocation()
	const { toggleSidebar } = useSidebar()

	const reviewItems = [
		{
			title: 'Practice',
			url: '/practice',
			icon: ListChecks,
			isActive: (pathname: string) => pathname === '/practice'
		},
		{
			title: 'Flashcards',
			url: '/flashcards',
			icon: Layers,
			isActive: (pathname: string) => pathname === '/flashcards'
		}
	]

	const libraryItems = [
		{
			title: 'Recent',
			url: '/recent',
			icon: Clock,
			isActive: (pathname: string) => pathname === '/recent'
		},
		{
			title: 'Topics',
			url: '/my-library',
			icon: Library,
			isActive: (pathname: string) => pathname === '/my-library'
		}
	]

	const activityItems = [
		{
			title: 'Logbook',
			url: '/logbook',
			icon: ListChecks,
			isActive: (pathname: string) => pathname === '/logbook'
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
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className='bg-primary-foreground'>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{reviewItems.map(item => {
								const isActive = item.isActive(location.pathname)
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											isActive={isActive}
											render={<Link to={item.url} />}
											tooltip={item.title}
										>
											<item.icon />
											<span>{item.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{libraryItems.map(item => {
								const isActive = item.isActive(location.pathname)
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											isActive={isActive}
											render={<Link to={item.url} />}
											tooltip={item.title}
										>
											<item.icon />
											<span>{item.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{activityItems.map(item => {
								const isActive = item.isActive(location.pathname)
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											isActive={isActive}
											render={<Link to={item.url} />}
											tooltip={item.title}
										>
											<item.icon />
											<span>{item.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)
							})}
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
							<SidebarMenuButton
								render={
									<TanStackRouterDevtools
										toggleButtonProps={{
											style: {
												position: 'static'
											}
										}}
									/>
								}
							/>
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

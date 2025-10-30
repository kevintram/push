import { Link, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
	Inbox,
	ListChecks,
	RotateCcw,
	Settings,
	SquareLibrary,
	SquarePen
} from 'lucide-react'
import { useState } from 'react'

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
import { useCreateTopic } from '~/features/topics/api/useCreateTopic'

export function AppSidebar() {
	const navigate = useNavigate()
	const { mutateAsync: insertTopic, isPending: isCreatingTopic } =
		useCreateTopic()
	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)

	const handleCreateTopic = async () => {
		const createdTopic = await insertTopic({})
		await navigate({
			to: '/topics/{-$topicId}',
			params: { topicId: createdTopic.id.toString() }
		})
	}

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
								<SidebarMenuButton
									disabled={isCreatingTopic}
									onClick={handleCreateTopic}
									tooltip='Add Topic'
									variant='secondary'
								>
									<SquarePen />
									<span>Add Topic</span>
								</SidebarMenuButton>
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

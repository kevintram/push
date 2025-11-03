import { Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
	Inbox,
	ListChecks,
	RotateCcw,
	Settings,
	SquareLibrary,
	SquarePen
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

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
import { TopicDialog } from '~/features/topics/components/TopicDialog'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import type { Topic } from '~/models/todo-topic.types'

export function AppSidebar() {
	const { mutateAsync: insertTopic, isPending: isCreatingTopic } =
		useCreateTopic()
	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
	const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	const handleDialogOpenChange = useCallback((open: boolean) => {
		setIsDialogOpen(open)
		if (!open) {
			setSelectedTopic(null)
		}
	}, [])

	const handleTopicChange = useCallback((topic: Topic) => {
		setSelectedTopic(topic)
	}, [])

	const handleCreateTopic = useCallback(async () => {
		const createdTopic = await insertTopic({})
		setSelectedTopic(createdTopic)
		setIsDialogOpen(true)
	}, [insertTopic])

	const contextValue = useMemo(
		() => ({
			topic: selectedTopic ?? undefined,
			onTopicChange: handleTopicChange
		}),
		[selectedTopic, handleTopicChange]
	)

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
			<TopicContext value={contextValue}>
				<TopicDialog
					onOpenChange={handleDialogOpenChange}
					open={isDialogOpen}
				/>
			</TopicContext>
		</Sidebar>
	)
}

import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
	Clock,
	Layers,
	Library,
	ListChecks,
	type LucideIcon,
	PanelLeft,
	Plus,
	Settings
} from 'lucide-react'
import { useState } from 'react'

import { SidebarSearch } from '~/app/components/AppSidebar/SidebarSearch'
import { SettingsDialog } from '~/components/SettingsDialog'
import { Button } from '~/components/ui/button'
import { CountBadge } from '~/components/ui/count-badge'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar
} from '~/components/ui/sidebar'
import { useReviewCardQueueCounts } from '~/features/review-cards/hooks/useReviewCardQueueCounts'
import type { ReviewCardType } from '~/features/review-cards/types/review-card.types'
import { useTopics } from '~/features/topics/api/getTopics'
import { requestCreateTopic } from '~/features/topics/createTopicIntent'

const ROOT_TOPICS_LIMIT = 10

function getTopicLabel(title: string) {
	return title.trim() || 'Untitled topic'
}

type ReviewSidebarItem = {
	title: string
	url: '/practice' | '/flashcards'
	icon: LucideIcon
	type: ReviewCardType
	isActive: (pathname: string) => boolean
}

function ReviewSidebarMenuItem({
	item,
	isActive
}: {
	item: ReviewSidebarItem
	isActive: boolean
}) {
	const { dueTodayCount, newCount, overdueCount } = useReviewCardQueueCounts({
		type: item.type
	})
	const tooltip = `${item.title}: ${overdueCount} actionable overdue, ${dueTodayCount} actionable today, ${newCount} new`

	return (
		<SidebarMenuItem key={item.title}>
			<SidebarMenuButton
				isActive={isActive}
				render={<Link to={item.url} />}
				tooltip={tooltip}
			>
				<item.icon />
				<span className='flex min-w-0 flex-1 items-center gap-2 group-data-[collapsible=icon]:hidden'>
					<span className='min-w-0 truncate'>{item.title}</span>
					<span
						aria-hidden='true'
						className='ml-auto flex shrink-0 items-center gap-1'
					>
						{overdueCount > 0 && (
							<CountBadge
								className='h-4 min-w-4 bg-red-600 px-1 text-[10px] text-white dark:bg-red-400'
								count={overdueCount}
							/>
						)}
						{dueTodayCount > 0 && (
							<CountBadge
								className='h-4 min-w-4 bg-transparent px-1 text-[10px] text-blue-600 dark:text-blue-400'
								count={dueTodayCount}
							/>
						)}
						{newCount > 0 && (
							<CountBadge
								className='h-4 min-w-4 px-1 text-[10px]'
								count={newCount}
							/>
						)}
					</span>
				</span>
			</SidebarMenuButton>
		</SidebarMenuItem>
	)
}

export function AppSidebar() {
	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
	const location = useLocation()
	const navigate = useNavigate()
	const { toggleSidebar } = useSidebar()
	const rootTopicsQuery = useTopics({
		root: true,
		sort: 'title',
		order: 'asc'
	})
	const rootTopics = rootTopicsQuery?.data ?? []

	const reviewItems: Array<ReviewSidebarItem> = [
		{
			title: 'Practice',
			url: '/practice',
			icon: ListChecks,
			type: 'practice',
			isActive: (pathname: string) => pathname === '/practice'
		},
		{
			title: 'Flashcards',
			url: '/flashcards',
			icon: Layers,
			type: 'flashcard',
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
			url: '/topics',
			icon: Library,
			isActive: (pathname: string) => pathname === '/topics'
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

	const handleAddTopic = () => {
		requestCreateTopic()

		if (
			location.pathname !== '/topics' &&
			!location.pathname.startsWith('/topics/')
		) {
			navigate({ to: '/topics' })
		}
	}

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
									<ReviewSidebarMenuItem
										isActive={isActive}
										item={item}
										key={item.title}
									/>
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

				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{libraryItems.map(item => {
								const isActive = item.isActive(location.pathname)
								const isTopicsItem = item.url === '/topics'
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
										{isTopicsItem && (
											<SidebarMenuAction
												aria-label='Add topic'
												className='z-10'
												onClick={event => {
													event.preventDefault()
													event.stopPropagation()
													handleAddTopic()
												}}
												type='button'
											>
												<Plus />
												<span className='sr-only'>Add topic</span>
											</SidebarMenuAction>
										)}
										{isTopicsItem && rootTopics.length > 0 && (
											<SidebarMenuSub>
												{rootTopics.slice(0, ROOT_TOPICS_LIMIT).map(topic => (
													<SidebarMenuSubItem key={topic.id}>
														<SidebarMenuSubButton
															isActive={
																location.pathname === `/topics/${topic.id}`
															}
															render={
																<Link
																	params={{
																		topicId: topic.id.toString()
																	}}
																	search={{ tab: 'subtopics' }}
																	to='/topics/$topicId'
																/>
															}
														>
															<span>{getTopicLabel(topic.title)}</span>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												))}
											</SidebarMenuSub>
										)}
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

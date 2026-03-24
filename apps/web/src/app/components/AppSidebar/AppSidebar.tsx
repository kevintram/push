import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
	Clock,
	Flag,
	Layers,
	Library,
	ListChecks,
	PanelLeft,
	Plus,
	Settings
} from 'lucide-react'
import { useState } from 'react'

import {
	type ReviewSidebarItem,
	ReviewSidebarMenuItem,
	type SidebarCountBadgeItem,
	SidebarCollapsedBadgeStack,
	type SidebarNavItem
} from '~/app/components/AppSidebar/AppSidebarMenuItems'
import { ReviewModeFooterControl } from '~/app/components/AppSidebar/ReviewModeFooterControl'
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
	useSidebar
} from '~/components/ui/sidebar'
import { useReviewCardFlaggedSummary } from '~/features/review-cards/api/getReviewCardFlaggedSummary'
import { requestCreateTopic } from '~/features/topics/createTopicIntent'

export function AppSidebar() {
	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
	const location = useLocation()
	const navigate = useNavigate()
	const { state, toggleSidebar } = useSidebar()
	const flaggedSummaryQuery = useReviewCardFlaggedSummary()
	const flaggedCount = flaggedSummaryQuery?.data?.flagged_count ?? 0
	const flaggedCollapsedBadges: Array<SidebarCountBadgeItem> = [
		{ key: 'flagged', count: flaggedCount }
	]

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
	const reviewUtilityItems: Array<SidebarNavItem> = [
		{
			title: 'Flagged',
			url: '/flagged',
			icon: Flag,
			isActive: (pathname: string) => pathname === '/flagged'
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
							{reviewUtilityItems.map(item => {
								const isActive = item.isActive(location.pathname)
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											isActive={isActive}
											render={<Link to={item.url} />}
											tooltip={item.title}
										>
											<item.icon />
											<span className='flex min-w-0 flex-1 items-center gap-2 group-data-[collapsible=icon]:hidden'>
												<span className='min-w-0 truncate'>{item.title}</span>
												{flaggedCount > 0 && (
													<span aria-hidden='true' className='ml-auto shrink-0'>
														<CountBadge
															className='h-4 min-w-4 px-1 text-[10px]'
															count={flaggedCount}
														/>
													</span>
												)}
											</span>
										</SidebarMenuButton>
										{state === 'collapsed' ? (
											<SidebarCollapsedBadgeStack
												badges={flaggedCollapsedBadges}
												testId='sidebar-collapsed-badges-flagged'
											/>
										) : null}
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
									</SidebarMenuItem>
								)
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className='bg-primary-foreground'>
				<SidebarMenu>
					<ReviewModeFooterControl />
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

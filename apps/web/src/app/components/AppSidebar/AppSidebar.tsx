import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Flag, Layers, Library, ListChecks, Plus } from 'lucide-react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import {
	type ReviewSidebarItem,
	ReviewSidebarMenuItem,
	SidebarCollapsedBadgeStack,
	type SidebarCountBadgeItem,
	type SidebarNavItem
} from '~/app/components/AppSidebar/AppSidebarMenuItems'
import { AppSidebarTopicTree } from '~/app/components/AppSidebar/AppSidebarTopicTree'
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
	SidebarTrigger,
	useSidebar
} from '~/components/ui/sidebar'
import { useReviewCardFlaggedSummary } from '~/features/review-cards/api/getReviewCardFlaggedSummary'
import { requestCreateTopic } from '~/features/topics/createTopicIntent'

export function AppSidebar({
	onResizeStart
}: {
	onResizeStart?: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
	const location = useLocation()
	const navigate = useNavigate()
	const { isMobile, state } = useSidebar()
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
			title: 'Topics',
			url: '/topics',
			icon: Library,
			isActive: (pathname: string) => pathname === '/topics'
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
		<Sidebar className='z-20 bg-primary-foreground' collapsible='icon'>
			<SidebarHeader className='px-1.5 py-1'>
				<SidebarTrigger className='rounded-full' />
			</SidebarHeader>
			<SidebarContent className='gap-1 overflow-hidden bg-primary-foreground'>
				<div className='flex shrink-0 flex-col gap-1'>
					<SidebarGroup className='px-1.5'>
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
													{flaggedCount > 0 ? (
														<span
															aria-hidden='true'
															className='ml-auto shrink-0'
														>
															<CountBadge
																className='h-4 min-w-4 px-1 text-[10px]'
																count={flaggedCount}
															/>
														</span>
													) : null}
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

					<SidebarGroup className='px-1.5'>
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
											{isTopicsItem ? (
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
											) : null}
										</SidebarMenuItem>
									)
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</div>

				<AppSidebarTopicTree />
			</SidebarContent>

			{import.meta.env.DEV && !import.meta.env.VITEST ? (
				<SidebarFooter className='border-sidebar-border/70 bg-primary-foreground px-1.5 py-1'>
					<SidebarMenu>
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
					</SidebarMenu>
				</SidebarFooter>
			) : null}

			{!isMobile && state === 'expanded' && onResizeStart ? (
				<div
					aria-hidden='true'
					className='absolute top-0 right-0 z-20 hidden h-full w-3 translate-x-1/2 cursor-col-resize items-center justify-center md:flex'
					onPointerDown={onResizeStart}
				>
					<div className='h-16 w-px rounded-full bg-border/70 transition-colors' />
				</div>
			) : null}
		</Sidebar>
	)
}

import { Link, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
	Clock,
	Layers,
	Library,
	ListChecks,
	type LucideIcon,
	PanelLeft,
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
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar
} from '~/components/ui/sidebar'
import { useReviewCardQueueCounts } from '~/features/review-cards/hooks/useReviewCardQueueCounts'
import type { ReviewCardType } from '~/features/review-cards/types/review-card.types'

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
				className='h-auto min-h-10 py-2'
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
	const { toggleSidebar } = useSidebar()

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

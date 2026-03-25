import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

import { CountBadge } from '~/components/ui/count-badge'
import {
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar
} from '~/components/ui/sidebar'
import { useReviewCardQueueCounts } from '~/features/review-cards/hooks/useReviewCardQueueCounts'
import type { ReviewCardType } from '~/features/review-cards/types/review-card.types'

export type SidebarNavItem = {
	title: string
	url: '/practice' | '/flashcards' | '/flagged'
	icon: LucideIcon
	isActive: (pathname: string) => boolean
}

export type ReviewSidebarItem = SidebarNavItem & {
	type: ReviewCardType
}

export type SidebarCountBadgeItem = {
	key: string
	count: number
	tone?: 'default' | 'neutral' | 'danger' | 'info'
}

export function SidebarCollapsedBadgeStack({
	badges,
	testId
}: {
	badges: Array<SidebarCountBadgeItem>
	testId?: string
}) {
	const visibleBadges = badges.filter(badge => badge.count > 0)

	if (visibleBadges.length === 0) return null

	return (
		<div
			aria-hidden='true'
			className='pointer-events-none absolute top-0 right-[-0.25rem] z-10 flex max-w-[calc(100%+1.25rem)] -translate-y-[46%] items-center justify-end'
			data-testid={testId}
		>
			{visibleBadges.map((badge, index) => (
				<span
					className={`${index > 0 ? '-ml-1' : ''} relative`}
					key={badge.key}
					style={{ zIndex: visibleBadges.length - index }}
				>
					<CountBadge
						className='rounded-sm shadow-sm'
						count={badge.count}
						size='compact'
						tone={badge.tone}
					/>
				</span>
			))}
		</div>
	)
}

export function ReviewSidebarMenuItem({
	item,
	isActive
}: {
	item: ReviewSidebarItem
	isActive: boolean
}) {
	const { dueTodayCount, newCount, overdueCount } = useReviewCardQueueCounts({
		type: item.type
	})
	const { state } = useSidebar()
	const collapsedBadges: Array<SidebarCountBadgeItem> = [
		{
			key: 'overdue',
			count: overdueCount,
			tone: 'danger'
		},
		{
			key: 'today',
			count: dueTodayCount,
			tone: 'info'
		},
		{
			key: 'new',
			count: newCount,
			tone: 'neutral'
		}
	]

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
					<span
						aria-hidden='true'
						className='ml-auto flex shrink-0 items-center gap-1'
					>
						{overdueCount > 0 ? (
							<CountBadge count={overdueCount} size='compact' tone='danger' />
						) : null}
						{dueTodayCount > 0 ? (
							<CountBadge count={dueTodayCount} size='compact' tone='info' />
						) : null}
						{newCount > 0 ? (
							<CountBadge count={newCount} size='compact' tone='neutral' />
						) : null}
					</span>
				</span>
			</SidebarMenuButton>
			{state === 'collapsed' ? (
				<SidebarCollapsedBadgeStack
					badges={collapsedBadges}
					testId={`sidebar-collapsed-badges-${item.type}`}
				/>
			) : null}
		</SidebarMenuItem>
	)
}

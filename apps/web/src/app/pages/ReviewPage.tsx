import { Link } from '@tanstack/react-router'
import { ArrowUpRight, BookOpen, Star } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { useReviewPageHandlers } from '~/app/hooks/useReviewPageHandlers'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	EntityCard,
	type EntityItem,
	estimateEntitySize,
	getEntityKey
} from '~/components/EntityCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import { buttonVariants } from '~/components/ui/button'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
import { CountBadge } from '~/components/ui/count-badge'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { Skeleton } from '~/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import {
	useTodaySchedulePreview,
	useUnscheduledReviewEntriesPreview,
	useUpcomingReviewEntriesPreview
} from '~/features/reviews/api/getReviewEntries'
import { useReviewQueue } from '~/features/reviews/api/getReviewQueue'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import type { ReviewListItem } from '~/features/reviews/types/review.types'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { useEntityNavigation } from '~/hooks/useEntityNavigation'
import { cn } from '~/lib/utils'
import type { FreshnessTier } from '~/models/learnable.types'
import { getFreshnessTierColor } from '~/utils/retrievability'

const SCHEDULE_PREVIEW_LIMIT = 3

export function ReviewPage() {
	const { handleReviewClick, selectedReviewId, closeReviewDialog } =
		useReviewPageHandlers()
	const { data: reviewQueue = [], isLoading: isQueueLoading } = useReviewQueue()
	const {
		entries: todayEntries,
		totalCount: todayTotalCount,
		isLoading: todayLoading
	} = useTodaySchedulePreview(SCHEDULE_PREVIEW_LIMIT)
	const {
		entries: upcomingEntries,
		totalCount: upcomingTotalCount,
		isLoading: upcomingLoading
	} = useUpcomingReviewEntriesPreview(SCHEDULE_PREVIEW_LIMIT)
	const {
		entries: unscheduledEntries,
		totalCount: unscheduledTotalCount,
		isLoading: unscheduledLoading
	} = useUnscheduledReviewEntriesPreview(SCHEDULE_PREVIEW_LIMIT)
	const queueItems = useMemo<Array<EntityItem>>(() => {
		const items: Array<EntityItem> = []
		for (const entry of reviewQueue) {
			if (entry.entity_type === 'topic' && entry.topic) {
				items.push({ type: 'topic', item: entry.topic })
				continue
			}
			if (entry.entity_type === 'source' && entry.source) {
				items.push({ type: 'source', item: entry.source })
				continue
			}
			if (entry.entity_type === 'practice' && entry.practice) {
				items.push({ type: 'practice', item: entry.practice })
			}
		}
		return items
	}, [reviewQueue])

	const tierGroups = useMemo(() => {
		const order: Array<FreshnessTier> = ['Forgotten', 'Hazy', 'Fine', 'Fresh']
		const groups = new Map<FreshnessTier, Array<EntityItem>>(
			order.map(tier => [tier, []])
		)

		for (const item of queueItems) {
			const tier = item.item.freshness_tier ?? 'Forgotten'
			const bucket = groups.get(tier)
			if (bucket) {
				bucket.push(item)
			}
		}

		return order
			.map(tier => ({
				tier,
				label: tier,
				items: groups.get(tier) ?? []
			}))
			.filter(group => group.items.length > 0)
	}, [queueItems])

	const isQueueEmpty = !isQueueLoading && queueItems.length === 0

	const handleEntityClick = useEntityNavigation()

	const scheduleTabs = useMemo(
		() => ({
			today: {
				value: 'today',
				label: 'Today',
				viewAllTo: '/today',
				totalCount: todayTotalCount,
				entries: todayEntries.slice(0, SCHEDULE_PREVIEW_LIMIT),
				isLoading: todayLoading,
				emptyText: 'Nothing scheduled for today.'
			},
			upcoming: {
				value: 'upcoming',
				label: 'Upcoming',
				viewAllTo: '/upcoming',
				totalCount: upcomingTotalCount,
				entries: upcomingEntries.slice(0, SCHEDULE_PREVIEW_LIMIT),
				isLoading: upcomingLoading,
				emptyText: 'No upcoming reviews.'
			},
			unscheduled: {
				value: 'unscheduled',
				label: 'Unscheduled',
				viewAllTo: '/unscheduled',
				totalCount: unscheduledTotalCount,
				entries: unscheduledEntries.slice(0, SCHEDULE_PREVIEW_LIMIT),
				isLoading: unscheduledLoading,
				emptyText: 'No unscheduled reviews.'
			}
		}),
		[
			todayEntries,
			todayLoading,
			todayTotalCount,
			upcomingEntries,
			upcomingLoading,
			upcomingTotalCount,
			unscheduledEntries,
			unscheduledLoading,
			unscheduledTotalCount
		]
	)

	return (
		<PageLayout>
			<PageLayout.Header icon={BookOpen} title='Review' />
			<PageLayout.Content className='max-w-screen'>
				<div className='flex flex-col gap-8'>
					<ScheduleCard onReviewClick={handleReviewClick} tabs={scheduleTabs} />

					<div className='space-y-4'>
						<h2 className='flex items-center gap-2 font-bold text-2xl'>
							<Star className='h-6 w-6 fill-yellow-500 text-yellow-500' />
							The Queue
						</h2>
						{isQueueLoading ? (
							<ReviewQueueSkeleton />
						) : isQueueEmpty ? (
							<ReviewQueueEmpty />
						) : (
							<ReviewQueueGroupedList
								groups={tierGroups}
								onEntityClick={handleEntityClick}
							/>
						)}
					</div>
				</div>
			</PageLayout.Content>
			<ReviewDialog
				onOpenChange={open => {
					if (!open) closeReviewDialog()
				}}
				open={selectedReviewId !== null}
				reviewId={selectedReviewId}
			/>
		</PageLayout>
	)
}

function ReviewQueueEmpty() {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant='icon'>
					<BookOpen />
				</EmptyMedia>
				<EmptyTitle>See items up for review</EmptyTitle>
			</EmptyHeader>
		</Empty>
	)
}

function ScheduleCard({
	tabs,
	onReviewClick
}: {
	tabs: Record<
		'today' | 'upcoming' | 'unscheduled',
		{
			value: string
			label: string
			viewAllTo: string
			totalCount: number
			entries: Array<ReviewListItem>
			isLoading: boolean
			emptyText: string
		}
	>
	onReviewClick: (reviewId: number) => void
}) {
	const [activeTab, setActiveTab] = useState<keyof typeof tabs>('today')
	const activeConfig = tabs[activeTab]

	return (
		<div className='flex flex-col gap-2'>
			<Tabs
				onValueChange={(value: string) =>
					setActiveTab(value as keyof typeof tabs)
				}
				value={activeTab}
			>
				<div className='flex items-center justify-between gap-4'>
					<TabsList className='w-fit'>
						<TabsTrigger value={tabs.today.value}>
							{tabs.today.label} <CountBadge count={tabs.today.totalCount} />
						</TabsTrigger>
						<TabsTrigger value={tabs.upcoming.value}>
							{tabs.upcoming.label}{' '}
							<CountBadge count={tabs.upcoming.totalCount} />
						</TabsTrigger>
						<TabsTrigger value={tabs.unscheduled.value}>
							{tabs.unscheduled.label}{' '}
							<CountBadge count={tabs.unscheduled.totalCount} />
						</TabsTrigger>
					</TabsList>
					<Link
						className={cn(
							buttonVariants({ size: 'sm', variant: 'link' }),
							'gap-1 text-muted-foreground hover:text-primary'
						)}
						to='/logbook'
					>
						Logbook
						<ArrowUpRight className='h-4 w-4' />
					</Link>
				</div>

				<Card className='gap-2'>
					<CardContent>
						<TabsContent value={tabs.today.value}>
							<ScheduleTabContent
								emptyText={tabs.today.emptyText}
								entries={tabs.today.entries}
								isLoading={tabs.today.isLoading}
								onReviewClick={onReviewClick}
							/>
						</TabsContent>
						<TabsContent value={tabs.upcoming.value}>
							<ScheduleTabContent
								emptyText={tabs.upcoming.emptyText}
								entries={tabs.upcoming.entries}
								isLoading={tabs.upcoming.isLoading}
								onReviewClick={onReviewClick}
							/>
						</TabsContent>
						<TabsContent value={tabs.unscheduled.value}>
							<ScheduleTabContent
								emptyText={tabs.unscheduled.emptyText}
								entries={tabs.unscheduled.entries}
								isLoading={tabs.unscheduled.isLoading}
								onReviewClick={onReviewClick}
							/>
						</TabsContent>
					</CardContent>
					{activeConfig.totalCount > SCHEDULE_PREVIEW_LIMIT && (
						<CardFooter className='justify-center pt-0'>
							<Link
								className={cn(
									buttonVariants({ size: 'sm', variant: 'ghost' }),
									'gap-1 text-muted-foreground hover:text-primary'
								)}
								to={activeConfig.viewAllTo}
							>
								View all
								<ArrowUpRight className='h-4 w-4' />
							</Link>
						</CardFooter>
					)}
				</Card>
			</Tabs>
		</div>
	)
}

function ScheduleTabContent({
	entries,
	isLoading,
	emptyText,
	onReviewClick
}: {
	entries: Array<ReviewListItem>
	isLoading: boolean
	emptyText: string
	onReviewClick: (reviewId: number) => void
}) {
	let content: React.ReactNode
	if (isLoading) {
		content = <ScheduleEntriesSkeleton />
	} else if (entries.length === 0) {
		content = (
			<p className='text-muted-foreground text-sm italic'>{emptyText}</p>
		)
	} else {
		content = (
			<ScheduleEntriesList entries={entries} onReviewClick={onReviewClick} />
		)
	}

	return <div className='space-y-3'>{content}</div>
}

function ScheduleEntriesList({
	entries,
	onReviewClick
}: {
	entries: Array<ReviewListItem>
	onReviewClick: (reviewId: number) => void
}) {
	return (
		<div className='flex flex-col'>
			{entries.map(entry => {
				return (
					<ReviewItem
						entry={entry}
						key={`review-${entry.id}`}
						onReviewClick={onReviewClick}
						variant='default'
					/>
				)
			})}
		</div>
	)
}

function ScheduleEntriesSkeleton() {
	return (
		<div className='space-y-2'>
			<Skeleton className='h-12 w-full' />
			<Skeleton className='h-12 w-full' />
			<Skeleton className='h-12 w-full' />
		</div>
	)
}

function ReviewQueueGroupedList({
	groups,
	onEntityClick
}: {
	groups: Array<{
		tier: FreshnessTier
		label: string
		items: Array<EntityItem>
	}>
	onEntityClick: (entity: EntityItem) => void
}) {
	const renderItem = useCallback(
		(entity: EntityItem) => {
			let headerRight: ReactNode
			switch (entity.type) {
				case 'topic':
					headerRight = <TopicActionMenu topic={entity.item} />
					break
				case 'source':
					headerRight = <SourceActionMenu source={entity.item} />
					break
				case 'practice':
					headerRight = <PracticeActionMenu practice={entity.item} />
					break
			}
			return (
				<EntityCard
					entity={entity}
					headerRight={headerRight}
					minHeight={96}
					onEntityClick={onEntityClick}
					showLeavingSoon={true}
				/>
			)
		},
		[onEntityClick]
	)

	return (
		<div className='space-y-8'>
			{groups.map(group => (
				<div className='space-y-3' key={group.tier}>
					<div>
						<h3
							className={`font-bold text-xl ${getFreshnessTierColor(
								group.tier,
								true
							)}`}
						>
							{group.label}
						</h3>
						{group.tier === 'Forgotten' && (
							<span className='font-semibold text-muted-foreground text-xs'>
								You'll probably have some relearning to do but better late than
								never!
							</span>
						)}
						{group.tier === 'Hazy' && (
							<span className='font-semibold text-muted-foreground text-xs'>
								A fine time to review, but there might be some relearning!
							</span>
						)}
						{group.tier === 'Fine' && (
							<span className='font-semibold text-muted-foreground text-xs'>
								The best time to review!
							</span>
						)}
						{group.tier === 'Fresh' && (
							<span className='font-semibold text-muted-foreground text-xs'>
								You could probably wait to review these!
							</span>
						)}
					</div>
					<MasonryLayout
						estimateItemSize={estimateEntitySize}
						gap={16}
						getItemKey={getEntityKey}
						items={group.items}
						minItemWidth={280}
						renderItem={renderItem}
					/>
				</div>
			))}
		</div>
	)
}

function ReviewQueueSkeleton() {
	return (
		<div className='space-y-8'>
			<div className='space-y-3'>
				<Skeleton className='h-7 w-24' />
				<MasonryLayoutSkeleton count={8} />
			</div>
			<div className='space-y-3'>
				<Skeleton className='h-7 w-16' />
				<MasonryLayoutSkeleton count={6} />
			</div>
		</div>
	)
}

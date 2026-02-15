import { Link } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { ArrowUpRight, BookOpen, type LucideProps, Star } from 'lucide-react'
import {
	forwardRef,
	type ReactNode,
	useCallback,
	useMemo,
	useState
} from 'react'
import { useReviewPageHandlers } from '~/app/hooks/useReviewPageHandlers'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	EntityCard,
	type EntityItem,
	estimateEntitySize,
	getEntityKey,
	getEntityTitle
} from '~/components/EntityCard'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import type { LearnableCardStatusBadge } from '~/components/LearnableCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { buttonVariants } from '~/components/ui/button'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
import { CountBadge } from '~/components/ui/count-badge'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import {
	useTodaySchedulePreview,
	useUnscheduledReviewEntriesPreview,
	useUpcomingReviewEntriesPreview
} from '~/features/reviews/api/getReviewEntries'
import { useReviewQueue } from '~/features/reviews/api/getReviewQueue'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import type { ReviewListItem } from '~/features/reviews/types/review.types'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { useEntityNavigation } from '~/hooks/useEntityNavigation'
import { cn } from '~/lib/utils'
import type { FreshnessTier } from '~/models/learnable.types'
import { getFreshnessTierColor } from '~/utils/retrievability'

// ── Shared types ──

type ReviewView = 'queue' | 'classic'

const REVIEW_VIEW_STORAGE_KEY = '3gulp-review-view'

function getStoredView(): ReviewView {
	try {
		const stored = localStorage.getItem(REVIEW_VIEW_STORAGE_KEY)
		if (stored === 'queue' || stored === 'classic') {
			return stored
		}
	} catch {
		// ignore
	}
	return 'queue'
}

// ── Queue view types ──

type QueueCardItem = {
	key: string
	entity: EntityItem
	queueType: 'due' | 'hazy'
	reviewId: number | null
	daysUntilDue: number | null
	daysUntilHazy: number | null
	urgencyDays: number
}

type QueueSection = {
	id: string
	label: string
	headingClassName?: string
	items: Array<QueueCardItem>
}

type StatusRowPlacement = 'above-header' | 'below-header'

// ── Queue view helpers ──

const QueueHeaderStarIcon = forwardRef<SVGSVGElement, LucideProps>(
	(props, ref) => (
		<Star
			ref={ref}
			{...props}
			className={`fill-yellow-500 text-yellow-500 ${props.className ?? ''}`}
		/>
	)
)
QueueHeaderStarIcon.displayName = 'QueueHeaderStarIcon'

function getWeekOffset(daysUntil: number, daysUntilSunday: number): number {
	if (daysUntil <= daysUntilSunday) {
		return 0
	}
	return 1 + Math.floor((daysUntil - daysUntilSunday - 1) / 7)
}

function formatDueLabel(daysUntilDue: number | null): string {
	if (daysUntilDue === null) {
		return 'Due'
	}
	if (daysUntilDue === 0) {
		return 'Due in 0d'
	}
	if (daysUntilDue < 0) {
		return `Due ${Math.abs(daysUntilDue)}d ago`
	}
	return `Due in ${daysUntilDue}d`
}

function formatDateFromOffset(daysFromToday: number | null): string | null {
	if (daysFromToday === null) {
		return null
	}
	return dayjs().startOf('day').add(daysFromToday, 'day').format('MMM D, YYYY')
}

function formatDueTooltip(daysUntilDue: number | null): string | null {
	return formatDateFromOffset(daysUntilDue)
}

function formatHazyTooltip(daysUntilHazy: number | null): string | null {
	return formatDateFromOffset(daysUntilHazy)
}

function formatHazySoonLabel(daysUntilHazy: number): string {
	if (daysUntilHazy === 0) {
		return 'Hazy in 0d'
	}
	return `Hazy in ${daysUntilHazy}d`
}

function sortUpcomingQueueItems(a: QueueCardItem, b: QueueCardItem): number {
	if (a.urgencyDays !== b.urgencyDays) {
		return a.urgencyDays - b.urgencyDays
	}
	if (a.queueType !== b.queueType) {
		return a.queueType === 'due' ? -1 : 1
	}
	return getEntityTitle(a.entity).localeCompare(getEntityTitle(b.entity))
}

function sortOverdueItems(a: QueueCardItem, b: QueueCardItem): number {
	const aDistance = Math.abs(a.urgencyDays)
	const bDistance = Math.abs(b.urgencyDays)
	if (aDistance !== bDistance) {
		return aDistance - bDistance
	}
	return getEntityTitle(a.entity).localeCompare(getEntityTitle(b.entity))
}

// ── Classic view constants ──

const SCHEDULE_PREVIEW_LIMIT = 3

// ── Main ReviewPage ──

export function ReviewPage() {
	const [view, setView] = useState<ReviewView>(getStoredView)

	function handleViewChange(value: Array<string>) {
		if (value.length > 0) {
			const newView = value.at(-1) as ReviewView
			setView(newView)
			localStorage.setItem(REVIEW_VIEW_STORAGE_KEY, newView)
		}
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={QueueHeaderStarIcon} title='Review'>
				<ToggleGroup
					onValueChange={handleViewChange}
					size='sm'
					value={[view]}
					variant='outline'
				>
					<ToggleGroupItem aria-label='Queue view' value='queue'>
						Queue
					</ToggleGroupItem>
					<ToggleGroupItem aria-label='Classic view' value='classic'>
						Classic
					</ToggleGroupItem>
				</ToggleGroup>
			</PageLayout.Header>
			<PageLayout.Content className='max-w-screen'>
				{view === 'queue' ? <QueueView /> : <ClassicView />}
			</PageLayout.Content>
		</PageLayout>
	)
}

// ── Queue View ──

function QueueView() {
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')
	const { data: reviewQueue = [], isLoading: isQueueLoading } = useReviewQueue()
	const handleEntityClick = useEntityNavigation()
	const { openReviewDialog } = useReviewDialog()
	const statusRowPlacement: StatusRowPlacement = 'above-header'

	const daysUntilSunday = useMemo(() => {
		return (7 - dayjs().day()) % 7
	}, [])

	const queueItems = useMemo<Array<QueueCardItem>>(() => {
		const items: Array<QueueCardItem> = []
		for (const entry of reviewQueue) {
			let entity: EntityItem | null = null
			if (entry.entity_type === 'topic' && entry.topic) {
				entity = { type: 'topic', item: entry.topic }
			} else if (entry.entity_type === 'source' && entry.source) {
				entity = { type: 'source', item: entry.source }
			} else if (entry.entity_type === 'practice' && entry.practice) {
				entity = { type: 'practice', item: entry.practice }
			}

			if (!entity) {
				continue
			}
			if (activeFilter !== 'all' && entity.type !== activeFilter) {
				continue
			}

			const urgencyDays =
				entry.queue_type === 'due'
					? entry.days_until_due
					: entry.days_until_hazy
			if (urgencyDays === null || urgencyDays === undefined) {
				continue
			}

			items.push({
				key:
					entry.queue_type === 'due' && entry.review_id != null
						? `due-${entry.review_id}`
						: `hazy-${entity.type}-${entity.item.id}`,
				entity,
				queueType: entry.queue_type,
				reviewId: entry.review_id ?? null,
				daysUntilDue: entry.days_until_due ?? null,
				daysUntilHazy: entry.days_until_hazy ?? null,
				urgencyDays
			})
		}

		return items
	}, [reviewQueue, activeFilter])

	const sections = useMemo<Array<QueueSection>>(() => {
		const overdueItems: Array<QueueCardItem> = []
		const weeklyBuckets = new Map<number, Array<QueueCardItem>>()

		for (const item of queueItems) {
			if (item.queueType === 'due' && item.urgencyDays < 0) {
				overdueItems.push(item)
				continue
			}
			if (item.urgencyDays < 0) {
				continue
			}

			const weekOffset = getWeekOffset(item.urgencyDays, daysUntilSunday)
			const bucket = weeklyBuckets.get(weekOffset)
			if (bucket) {
				bucket.push(item)
			} else {
				weeklyBuckets.set(weekOffset, [item])
			}
		}

		const output: Array<QueueSection> = []
		if (overdueItems.length > 0) {
			output.push({
				id: 'overdue',
				label: 'Overdue',
				headingClassName: 'text-red-600 dark:text-red-400',
				items: [...overdueItems].sort(sortOverdueItems)
			})
		}

		const weekOffsets = [...weeklyBuckets.keys()].sort((a, b) => a - b)
		for (const offset of weekOffsets) {
			const bucketItems = weeklyBuckets.get(offset)
			if (!bucketItems || bucketItems.length === 0) {
				continue
			}
			output.push({
				id: `week-${offset}`,
				label:
					offset === 0
						? 'This week'
						: offset === 1
							? 'Next week'
							: `In ${offset} weeks`,
				items: [...bucketItems].sort(sortUpcomingQueueItems)
			})
		}

		return output
	}, [queueItems, daysUntilSunday])

	const isQueueEmpty = !isQueueLoading && sections.length === 0

	return (
		<div className='space-y-4'>
			<EntityTypeFilter
				activeFilter={activeFilter}
				onFilterChange={setActiveFilter}
			/>
			{isQueueLoading ? (
				<ReviewQueueSkeleton />
			) : isQueueEmpty ? (
				<ReviewQueueEmpty />
			) : (
				<QueueGroupedList
					onDueBadgeClick={openReviewDialog}
					onEntityClick={handleEntityClick}
					sections={sections}
					statusRowPlacement={statusRowPlacement}
				/>
			)}
		</div>
	)
}

// ── Classic View ──

function ClassicView() {
	const { handleReviewClick, selectedReviewId, closeReviewDialog } =
		useReviewPageHandlers()
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')
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
		if (activeFilter !== 'all') {
			return items.filter(item => item.type === activeFilter)
		}
		return items
	}, [reviewQueue, activeFilter])

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
		<div className='flex flex-col gap-8'>
			<ScheduleCard onReviewClick={handleReviewClick} tabs={scheduleTabs} />

			<div className='space-y-4'>
				<div className='flex flex-col gap-2'>
					<h2 className='flex items-center gap-2 font-bold text-2xl'>
						<Star className='h-6 w-6 fill-yellow-500 text-yellow-500' />
						The Queue
					</h2>
					<EntityTypeFilter
						activeFilter={activeFilter}
						onFilterChange={setActiveFilter}
					/>
				</div>
				{isQueueLoading ? (
					<ReviewQueueSkeleton />
				) : isQueueEmpty ? (
					<ReviewQueueEmpty />
				) : (
					<ClassicQueueGroupedList
						groups={tierGroups}
						onEntityClick={handleEntityClick}
					/>
				)}
			</div>
			<ReviewDialog
				onOpenChange={open => {
					if (!open) closeReviewDialog()
				}}
				open={selectedReviewId !== null}
				reviewId={selectedReviewId}
			/>
		</div>
	)
}

// ── Shared components ──

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

function ReviewQueueSkeleton() {
	return <LoadingSpinner containerClassName='min-h-64' />
}

// ── Queue view components ──

function QueueGroupedList({
	sections,
	onEntityClick,
	onDueBadgeClick,
	statusRowPlacement
}: {
	sections: Array<QueueSection>
	onEntityClick: (entity: EntityItem) => void
	onDueBadgeClick: (reviewId: number) => void
	statusRowPlacement: StatusRowPlacement
}) {
	const renderItem = useCallback(
		(queueItem: QueueCardItem) => {
			const entity = queueItem.entity
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

			let dueStatusBadge: LearnableCardStatusBadge | null = null
			if (queueItem.queueType === 'due') {
				const isOverdue = (queueItem.daysUntilDue ?? 0) < 0
				const isDueToday = (queueItem.daysUntilDue ?? 0) === 0
				const dueReviewId = queueItem.reviewId
				dueStatusBadge = {
					label: formatDueLabel(queueItem.daysUntilDue),
					tooltip: formatDueTooltip(queueItem.daysUntilDue),
					onClick:
						dueReviewId != null
							? () => onDueBadgeClick(dueReviewId)
							: undefined,
					variant: isOverdue ? 'destructive' : 'warning',
					className: isOverdue
						? 'h-5 border-transparent bg-rose-200 text-rose-900 text-xs dark:bg-red-950 dark:text-red-200'
						: isDueToday
							? 'h-5 border border-blue-300 bg-blue-100 text-blue-900 text-xs dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200'
							: 'h-5 border border-zinc-300 bg-zinc-100 text-zinc-900 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
				}
			}

			let hazyStatusBadge: LearnableCardStatusBadge | null = null
			if (
				queueItem.daysUntilHazy !== null &&
				queueItem.daysUntilHazy >= 0 &&
				queueItem.daysUntilHazy <= 7
			) {
				hazyStatusBadge = {
					label: formatHazySoonLabel(queueItem.daysUntilHazy),
					tooltip: formatHazyTooltip(queueItem.daysUntilHazy),
					variant: 'outline',
					className:
						'h-5 border-transparent bg-amber-100 text-amber-900 text-xs dark:bg-amber-950 dark:text-amber-200'
				}
			}

			const statusBadges: Array<LearnableCardStatusBadge> = []
			if (hazyStatusBadge) statusBadges.push(hazyStatusBadge)
			if (dueStatusBadge) statusBadges.push(dueStatusBadge)

			return (
				<EntityCard
					entity={entity}
					headerRight={headerRight}
					minHeight={96}
					onEntityClick={onEntityClick}
					statusBadges={statusBadges}
					statusRowPlacement={statusRowPlacement}
				/>
			)
		},
		[onDueBadgeClick, onEntityClick, statusRowPlacement]
	)

	return (
		<div className='space-y-8'>
			{sections.map(section => (
				<div className='space-y-3' key={section.id}>
					<div className='flex items-center gap-2'>
						<h3
							className={`font-bold text-xl ${section.headingClassName ?? ''}`}
						>
							{section.label}
						</h3>
						<CountBadge count={section.items.length} />
					</div>
					<MasonryLayout
						estimateItemSize={(item, index, laneWidth) =>
							estimateEntitySize(item.entity, index, laneWidth)
						}
						gap={16}
						getItemKey={item => item.key}
						items={section.items}
						renderItem={renderItem}
					/>
				</div>
			))}
		</div>
	)
}

// ── Classic view components ──

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
	return <LoadingSpinner containerClassName='min-h-28 py-2' />
}

function ClassicQueueGroupedList({
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
						renderItem={renderItem}
					/>
				</div>
			))}
		</div>
	)
}

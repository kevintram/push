import dayjs from 'dayjs'
import { BookOpen, type LucideProps, Star } from 'lucide-react'
import {
	forwardRef,
	type MouseEvent as ReactMouseEvent,
	type ReactNode,
	useCallback,
	useMemo,
	useRef,
	useState
} from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	EntityCard,
	type EntityItem,
	estimateEntitySize,
	getEntityTitle
} from '~/components/EntityCard'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import type { LearnableCardStatusBadge } from '~/components/LearnableCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { CountBadge } from '~/components/ui/count-badge'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { useReviewQueue } from '~/features/reviews/api/getReviewQueue'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { useEntityNavigation } from '~/hooks/useEntityNavigation'

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

function formatHazyForLabel(daysInTier: number): string {
	return `Hazy for ${daysInTier}d`
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

/**
 * Build a bidirectional relationship map from parent_id links between entities
 * currently visible on the review page. When entity A is a parent of entity B
 * (both present in the queue), hovering either should highlight the other.
 */
function buildRelationshipMap(
	items: Array<QueueCardItem>
): Map<string, Set<string>> {
	const map = new Map<string, Set<string>>()
	const presentKeys = new Set<string>()

	for (const item of items) {
		presentKeys.add(`${item.entity.type}-${item.entity.item.id}`)
	}

	function addBidirectional(a: string, b: string) {
		if (!map.has(a)) map.set(a, new Set())
		if (!map.has(b)) map.set(b, new Set())
		map.get(a)!.add(b)
		map.get(b)!.add(a)
	}

	for (const item of items) {
		const { entity } = item
		const key = `${entity.type}-${entity.item.id}`

		// Parent-child relationships for topics and sources
		if (entity.type === 'topic' || entity.type === 'source') {
			const parentId = entity.item.parent_id
			if (parentId != null) {
				const parentKey = `${entity.type}-${parentId}`
				if (presentKeys.has(parentKey)) {
					addBidirectional(key, parentKey)
				}
			}
		}
	}

	return map
}

export function ReviewPage() {
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
			if (item.urgencyDays < 0) {
				overdueItems.push(item)
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
				headingClassName:
					offset === 0 ? 'text-blue-600 dark:text-blue-400' : undefined,
				items: [...bucketItems].sort(sortUpcomingQueueItems)
			})
		}

		return output
	}, [queueItems, daysUntilSunday])

	const isQueueEmpty = !isQueueLoading && sections.length === 0

	return (
		<PageLayout>
			<PageLayout.Header icon={QueueHeaderStarIcon} title='Review'>
				<EntityTypeFilter
					activeFilter={activeFilter}
					onFilterChange={setActiveFilter}
				/>
			</PageLayout.Header>
			<PageLayout.Content className='max-w-screen'>
				{isQueueLoading ? (
					<ReviewQueueSkeleton />
				) : isQueueEmpty ? (
					<ReviewQueueEmpty />
				) : (
					<ReviewQueueGroupedList
						onDueBadgeClick={openReviewDialog}
						onEntityClick={handleEntityClick}
						sections={sections}
						statusRowPlacement={statusRowPlacement}
					/>
				)}
			</PageLayout.Content>
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

function ReviewQueueGroupedList({
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
	// --- Related-entity highlight (DOM-based to avoid re-renders) ---
	const containerRef = useRef<HTMLDivElement>(null)
	const lastHoveredKeyRef = useRef<string | null>(null)

	const relationshipMap = useMemo(() => {
		const allItems = sections.flatMap(s => s.items)
		return buildRelationshipMap(allItems)
	}, [sections])

	const handleMouseOver = useCallback(
		(e: ReactMouseEvent) => {
			const container = containerRef.current
			if (!container) return

			const cardWrapper = (e.target as HTMLElement).closest('[data-entity-key]')
			const newKey = cardWrapper?.getAttribute('data-entity-key') ?? null

			if (newKey === lastHoveredKeyRef.current) return
			lastHoveredKeyRef.current = newKey

			// Clear previous highlights
			for (const el of container.querySelectorAll('[data-related-highlight]')) {
				delete (el as HTMLElement).dataset.relatedHighlight
			}

			if (!newKey) return

			const relatedKeys = relationshipMap.get(newKey)
			if (!relatedKeys || relatedKeys.size === 0) return

			for (const key of relatedKeys) {
				for (const el of container.querySelectorAll(
					`[data-entity-key="${key}"]`
				)) {
					;(el as HTMLElement).dataset.relatedHighlight = 'true'
				}
			}
		},
		[relationshipMap]
	)

	const handleMouseLeave = useCallback(() => {
		const container = containerRef.current
		if (!container) return
		lastHoveredKeyRef.current = null
		for (const el of container.querySelectorAll('[data-related-highlight]')) {
			delete (el as HTMLElement).dataset.relatedHighlight
		}
	}, [])

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

			let hazyForBadge: LearnableCardStatusBadge | null = null
			if (
				queueItem.urgencyDays < 0 &&
				entity.item.freshness_tier === 'Hazy' &&
				entity.item.days_in_current_tier != null
			) {
				hazyForBadge = {
					label: formatHazyForLabel(entity.item.days_in_current_tier),
					variant: 'outline',
					className:
						'h-5 border-transparent bg-amber-100 text-amber-900 text-xs dark:bg-amber-950 dark:text-amber-200'
				}
			}

			const statusBadges: Array<LearnableCardStatusBadge> = []
			if (hazyForBadge) statusBadges.push(hazyForBadge)
			if (hazyStatusBadge) statusBadges.push(hazyStatusBadge)
			if (dueStatusBadge) statusBadges.push(dueStatusBadge)

			return (
				<div
					className='rounded-xl transition-shadow duration-200 data-[related-highlight]:ring-2 data-[related-highlight]:ring-blue-400/60 dark:data-[related-highlight]:ring-blue-400/40'
					data-entity-key={`${entity.type}-${entity.item.id}`}
				>
					<EntityCard
						entity={entity}
						headerRight={headerRight}
						minHeight={96}
						onEntityClick={onEntityClick}
						statusBadges={statusBadges}
						statusRowPlacement={statusRowPlacement}
					/>
				</div>
			)
		},
		[onDueBadgeClick, onEntityClick, statusRowPlacement]
	)

	return (
		<div
			className='space-y-8'
			onMouseLeave={handleMouseLeave}
			onMouseOver={handleMouseOver}
			ref={containerRef}
		>
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

function ReviewQueueSkeleton() {
	return <LoadingSpinner containerClassName='min-h-64' />
}

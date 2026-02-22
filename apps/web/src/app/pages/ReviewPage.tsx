import dayjs from 'dayjs'
import { BookOpen, type LucideProps, Star } from 'lucide-react'
import { forwardRef, useMemo, useState } from 'react'
import { ReviewModeWarningDialog } from '~/app/components/ReviewModeWarningDialog'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { CountBadge } from '~/components/ui/count-badge'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useNotes } from '~/features/notes/api/getNotes'
import {
	NoteCard,
	toNoteCardStatusBadge
} from '~/features/notes/components/NoteCard'
import type { Note } from '~/features/notes/types/note.types'
import { orderNoteStatusBadges } from '~/features/notes/utils/orderNoteStatusBadges'
import { useReviewQueue } from '~/features/reviews/api/getReviewQueue'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import type { ReviewQueueItem } from '~/features/reviews/types/review-queue.types'
import { useNoteNavigation } from '~/hooks/useNoteNavigation'
import { estimateCardSize } from '~/utils/estimateCardSize'

function getWeekOffset(daysUntil: number, daysUntilSunday: number): number {
	if (daysUntil <= daysUntilSunday) return 0
	return 1 + Math.floor((daysUntil - daysUntilSunday - 1) / 7)
}

type QueueCardItem = {
	key: string
	entry: ReviewQueueItem
	queueType: 'due' | 'hazy'
	urgencyDays: number
}

type QueueSection = {
	id: string
	label: string
	headingClassName?: string
	items: Array<QueueCardItem>
}

type ReviewQueueTab = 'due' | 'unreviewed'

function getQueueItemTitle(item: QueueCardItem): string {
	return item.entry.note.title || 'Untitled note'
}

function sortUpcomingQueueItems(a: QueueCardItem, b: QueueCardItem): number {
	if (a.urgencyDays !== b.urgencyDays) {
		return a.urgencyDays - b.urgencyDays
	}
	if (a.queueType !== b.queueType) {
		return a.queueType === 'due' ? -1 : 1
	}
	return getQueueItemTitle(a).localeCompare(getQueueItemTitle(b))
}

function sortOverdueItems(a: QueueCardItem, b: QueueCardItem): number {
	// Overdue values are negative, so lower values are more overdue and should
	// remain earlier in the list to preserve stable, intuitive ordering.
	if (a.urgencyDays !== b.urgencyDays) {
		return a.urgencyDays - b.urgencyDays
	}
	if (a.queueType !== b.queueType) {
		return a.queueType === 'due' ? -1 : 1
	}
	return getQueueItemTitle(a).localeCompare(getQueueItemTitle(b))
}

function matchesNoteFilter(note: Note, filter: EntityTypeFilterValue): boolean {
	if (filter === 'all') return true
	if (filter === 'none') return note.tags.length === 0
	if (filter === 'topic') return note.tags.includes('TOPIC')
	if (filter === 'source') return note.tags.includes('SOURCE')
	return note.tags.includes('PRACTICE')
}

function groupUnreviewedByCreatedDate(
	notes: Array<Note>
): Array<{ id: string; label: string; notes: Array<Note> }> {
	const now = new Date()
	now.setHours(0, 0, 0, 0)

	const byKey = new Map<
		string,
		{ id: string; label: string; notes: Array<Note> }
	>()
	for (const note of notes) {
		const createdAt = new Date(note.inserted_at)
		const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`
		const existing = byKey.get(key)
		if (existing) {
			existing.notes.push(note)
			continue
		}

		const normalized = new Date(createdAt)
		normalized.setHours(0, 0, 0, 0)
		const diffDays = Math.floor(
			(now.getTime() - normalized.getTime()) / (1000 * 60 * 60 * 24)
		)
		const label =
			diffDays <= 0
				? 'Today'
				: diffDays === 1
					? 'Yesterday'
					: `${diffDays}d ago`

		byKey.set(key, { id: key, label, notes: [note] })
	}

	return [...byKey.values()]
		.map(section => ({
			...section,
			notes: [...section.notes].sort((a, b) =>
				a.inserted_at < b.inserted_at ? 1 : -1
			)
		}))
		.sort((a, b) => (a.id < b.id ? 1 : -1))
}

export function ReviewPage() {
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')
	const [activeQueueTab, setActiveQueueTab] = useState<ReviewQueueTab>('due')
	const { data: reviewQueue = [], isLoading: isQueueLoading } = useReviewQueue()
	const { data: notes = [], isLoading: isNotesLoading } = useNotes({
		archived: false,
		srs_enabled: true,
		order: 'desc'
	})
	const navigateToNote = useNoteNavigation()
	const { openReviewDialog } = useReviewDialog()

	const daysUntilSunday = useMemo(() => (7 - dayjs().day()) % 7, [])

	const queueItems = useMemo<Array<QueueCardItem>>(() => {
		return reviewQueue
			.map(entry => {
				const urgencyDays =
					entry.queue_type === 'due'
						? entry.days_until_due
						: entry.days_until_hazy
				if (urgencyDays === null || urgencyDays === undefined) return null
				const key =
					entry.queue_type === 'due' && entry.review_id != null
						? `due-${entry.review_id}`
						: `hazy-note-${entry.note.id}`
				return { key, entry, queueType: entry.queue_type, urgencyDays }
			})
			.filter((item): item is QueueCardItem => item !== null)
			.filter(item => matchesNoteFilter(item.entry.note, activeFilter))
	}, [reviewQueue, activeFilter])

	const unreviewedNotes = useMemo(
		() =>
			notes.filter(
				note =>
					note.last_reviewed_at === null &&
					matchesNoteFilter(note, activeFilter)
			),
		[notes, activeFilter]
	)

	const queueSections = useMemo<Array<QueueSection>>(() => {
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

		for (const offset of [...weeklyBuckets.keys()].sort((a, b) => a - b)) {
			const bucketItems = weeklyBuckets.get(offset)
			if (!bucketItems || bucketItems.length === 0) continue
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

	const unreviewedSections = useMemo(
		() => groupUnreviewedByCreatedDate(unreviewedNotes),
		[unreviewedNotes]
	)

	const isActiveTabLoading =
		activeQueueTab === 'due' ? isQueueLoading : isNotesLoading
	const isQueueEmpty =
		!isActiveTabLoading &&
		(activeQueueTab === 'due'
			? queueSections.length === 0
			: unreviewedSections.length === 0)
	const hasActionableContent =
		queueSections.length > 0 || unreviewedSections.length > 0

	return (
		<PageLayout>
			{hasActionableContent && <ReviewModeWarningDialog />}
			<PageLayout.Header icon={ReviewSidebarStarIcon} title='Review'>
				<div className='flex justify-start'>
					<Tabs
						className='-mb-2'
						onValueChange={value => {
							if (value === 'due' || value === 'unreviewed') {
								setActiveQueueTab(value)
							}
						}}
						value={activeQueueTab}
					>
						<TabsList className='border-b-0' variant='line'>
							<TabsTrigger className='gap-2' value='due'>
								<span>Due</span>
							</TabsTrigger>
							<TabsTrigger className='gap-2' value='unreviewed'>
								<span>Unreviewed</span>
								<CountBadge
									className='h-4 min-w-4 px-1 text-[10px]'
									count={unreviewedNotes.length}
								/>
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			</PageLayout.Header>
			<PageLayout.Content className='max-w-screen px-6 pt-3 pb-6'>
				<div className='mb-4'>
					<EntityTypeFilter
						activeFilter={activeFilter}
						onFilterChange={setActiveFilter}
					/>
				</div>
				{isActiveTabLoading ? (
					<LoadingSpinner containerClassName='min-h-64' />
				) : isQueueEmpty ? (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<BookOpen />
							</EmptyMedia>
							<EmptyTitle>See items up for review</EmptyTitle>
						</EmptyHeader>
					</Empty>
				) : activeQueueTab === 'unreviewed' ? (
					<div className='space-y-8'>
						{unreviewedSections.map(section => (
							<div className='space-y-3' key={section.id}>
								<div className='flex items-center gap-2'>
									<h3 className='font-bold text-xl'>{section.label}</h3>
									<CountBadge count={section.notes.length} />
								</div>
								<MasonryLayout
									estimateItemSize={(note, _index, laneWidth) =>
										estimateCardSize(
											note.title || 'Untitled note',
											note.body || '',
											laneWidth
										)
									}
									gap={16}
									getItemKey={note => `unreviewed-note-${note.id}`}
									items={section.notes}
									renderItem={note => (
										<NoteCard
											note={note}
											onClick={() => navigateToNote(note.id)}
										/>
									)}
								/>
							</div>
						))}
					</div>
				) : (
					<div className='space-y-8'>
						{queueSections.map(section => (
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
									estimateItemSize={(item, _index, laneWidth) =>
										estimateCardSize(
											item.entry.note.title || 'Untitled note',
											item.entry.note.body || '',
											laneWidth
										)
									}
									gap={16}
									getItemKey={item => item.key}
									items={section.items}
									renderItem={item => {
										const badges = orderNoteStatusBadges(
											item.entry.status_badges ?? []
										).map(apiBadge =>
											toNoteCardStatusBadge(apiBadge, {
												onOpenReviewDialog: openReviewDialog
											})
										)

										return (
											<NoteCard
												note={item.entry.note}
												onClick={() => navigateToNote(item.entry.note.id)}
												statusBadges={badges}
											/>
										)
									}}
								/>
							</div>
						))}
					</div>
				)}
			</PageLayout.Content>
		</PageLayout>
	)
}

const ReviewSidebarStarIcon = forwardRef<SVGSVGElement, LucideProps>(
	({ className, ...props }, ref) => (
		<Star
			ref={ref}
			{...props}
			className={`fill-yellow-500 text-yellow-500 ${className ?? ''}`}
		/>
	)
)

ReviewSidebarStarIcon.displayName = 'ReviewSidebarStarIcon'

import { Link, useNavigate } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import {
	BookOpen,
	Calendar,
	ChevronDown,
	ChevronRight,
	History,
	Home
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card'
import { Skeleton } from '~/components/ui/Skeleton'
import {
	useSoonReviewEntries,
	useTodayReviewEntries
} from '~/features/reviews/api/getReviewEntries'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import type { ReviewEntry } from '~/features/reviews/components/ReviewSection'
import { ReviewSessionItem } from '~/features/reviews/components/ReviewSessionItem'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import {
	getRetrievabilityBucket,
	type RetrievabilityBucket
} from '~/utils/retrievability'

const TODAY_LIMIT = 3
const UPCOMING_LIMIT = 3
const REVIEW_LIMIT = 10
const RECENT_LIMIT = 12

// ============================================================================
// Shared Helper Components
// ============================================================================

function CardHeaderLink({
	icon: Icon,
	title,
	to
}: {
	icon: LucideIcon
	title: string
	to: string
}) {
	return (
		<Link
			className='group -mx-2 -my-1 flex items-center justify-between px-2 py-1'
			to={to}
		>
			<div className='flex items-center gap-2'>
				<Icon className='h-5 w-5 text-muted-foreground' />
				<CardTitle>{title}</CardTitle>
			</div>
			<div className='flex items-center gap-1'>
				<span className='text-muted-foreground text-sm group-hover:text-primary'>
					View all
				</span>
				<ChevronRight className='h-4 w-4 text-muted-foreground group-hover:text-primary' />
			</div>
		</Link>
	)
}

function CollapsibleSectionHeader({
	label,
	count,
	headingClassName,
	isCollapsed,
	onToggle
}: {
	label: string
	count: number
	headingClassName?: string
	isCollapsed: boolean
	onToggle: () => void
}) {
	return (
		<Button
			className='flex items-center gap-2 p-0'
			onClick={onToggle}
			variant='ghost'
		>
			<h3 className={`font-semibold text-sm ${headingClassName ?? ''}`.trim()}>
				{label} <span className='text-muted-foreground'>({count})</span>
			</h3>
			<ChevronDown
				className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
			/>
		</Button>
	)
}

function limitSections<T>(
	sections: Array<T>,
	limit: number,
	getCount: (section: T) => number,
	sliceItems: (section: T, count: number) => T
): Array<T> {
	let remaining = limit
	const result: Array<T> = []

	for (const section of sections) {
		if (remaining <= 0) continue
		const itemCount = getCount(section)
		const toTake = Math.min(itemCount, remaining)
		if (toTake > 0) {
			result.push(sliceItems(section, toTake))
			remaining -= toTake
		}
	}

	return result.filter(s => getCount(s) > 0)
}

export function HomePage() {
	return (
		<PageLayout>
			<PageLayout.Header icon={Home} title='Home' />
			<PageLayout.Content className='max-w-450'>
				<div className='grid gap-4 md:grid-cols-2'>
					<div className='flex flex-col gap-4'>
						<HomeTodayCard />
						<HomeUpcomingCard />
					</div>
					<HomeReviewCard />
					<div className='md:col-span-2'>
						<HomeRecentCard />
					</div>
				</div>
			</PageLayout.Content>
		</PageLayout>
	)
}

// ============================================================================
// HomeTodayCard - Shows today's review entries (3 items max)
// ============================================================================

type ScheduledSection = {
	id: string
	label: string
	headingClassName?: string
	entries: Array<ReviewEntry>
}

function HomeTodayCard() {
	const navigate = useNavigate()
	const { sections: todaySections, isLoading } = useTodayReviewEntries()

	const { collapsedSections, toggleSection } = useSectionCollapse()
	const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)

	const sections = useMemo(() => {
		const allSections: Array<ScheduledSection> = todaySections.map(s => ({
			id: s.id,
			label: s.label,
			headingClassName: s.headingClassName,
			entries: s.entries
		}))

		return limitSections(
			allSections,
			TODAY_LIMIT,
			s => s.entries.length,
			(s, count) => ({ ...s, entries: s.entries.slice(0, count) })
		)
	}, [todaySections])

	const handleSessionClick = useCallback(
		(sessionId: number) => {
			navigate({
				to: '/review-session/$reviewSessionId',
				params: { reviewSessionId: sessionId.toString() }
			})
		},
		[navigate]
	)

	const handleReviewClick = useCallback((reviewId: number) => {
		setSelectedReviewId(reviewId)
	}, [])

	const closeReviewDialog = useCallback(() => {
		setSelectedReviewId(null)
	}, [])

	const isEmpty = sections.every(section => section.entries.length === 0)

	return (
		<>
			<Card className='flex h-full flex-col'>
				<CardHeader>
					<CardHeaderLink icon={Calendar} title='Today' to='/today' />
				</CardHeader>
				<CardContent className='max-h-80 overflow-y-auto'>
					<ScheduledCardContent
						collapsedSections={collapsedSections}
						isEmpty={isEmpty}
						isLoading={isLoading}
						onReviewClick={handleReviewClick}
						onSessionClick={handleSessionClick}
						onToggleCollapse={toggleSection}
						sections={sections}
					/>
				</CardContent>
			</Card>
			<ReviewDialog
				onOpenChange={open => {
					if (!open) closeReviewDialog()
				}}
				open={selectedReviewId !== null}
				reviewId={selectedReviewId}
			/>
		</>
	)
}

// ============================================================================
// HomeUpcomingCard - Shows upcoming review entries (3 items max)
// ============================================================================

function HomeUpcomingCard() {
	const navigate = useNavigate()
	const { sections: soonSections, isLoading } = useSoonReviewEntries()

	const { collapsedSections, toggleSection } = useSectionCollapse()
	const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)

	const sections = useMemo(() => {
		const allSections: Array<ScheduledSection> = soonSections.map(s => ({
			id: s.id,
			label: s.label,
			headingClassName: s.headingClassName,
			entries: s.entries
		}))

		return limitSections(
			allSections,
			UPCOMING_LIMIT,
			s => s.entries.length,
			(s, count) => ({ ...s, entries: s.entries.slice(0, count) })
		)
	}, [soonSections])

	const handleSessionClick = useCallback(
		(sessionId: number) => {
			navigate({
				to: '/review-session/$reviewSessionId',
				params: { reviewSessionId: sessionId.toString() }
			})
		},
		[navigate]
	)

	const handleReviewClick = useCallback((reviewId: number) => {
		setSelectedReviewId(reviewId)
	}, [])

	const closeReviewDialog = useCallback(() => {
		setSelectedReviewId(null)
	}, [])

	const isEmpty = sections.every(section => section.entries.length === 0)

	return (
		<>
			<Card className='flex h-full flex-col'>
				<CardHeader>
					<CardHeaderLink icon={Calendar} title='Upcoming' to='/upcoming' />
				</CardHeader>
				<CardContent className='max-h-80 overflow-y-auto'>
					<ScheduledCardContent
						collapsedSections={collapsedSections}
						isEmpty={isEmpty}
						isLoading={isLoading}
						onReviewClick={handleReviewClick}
						onSessionClick={handleSessionClick}
						onToggleCollapse={toggleSection}
						sections={sections}
					/>
				</CardContent>
			</Card>
			<ReviewDialog
				onOpenChange={open => {
					if (!open) closeReviewDialog()
				}}
				open={selectedReviewId !== null}
				reviewId={selectedReviewId}
			/>
		</>
	)
}

function HomeScheduledSection({
	id,
	label,
	headingClassName,
	entries,
	isCollapsed,
	onToggleCollapse,
	onSessionClick,
	onReviewClick
}: {
	id: string
	label: string
	headingClassName?: string
	entries: Array<ReviewEntry>
	isCollapsed: boolean
	onToggleCollapse: (sectionId: string) => void
	onSessionClick: (sessionId: number) => void
	onReviewClick: (reviewId: number) => void
}) {
	return (
		<div>
			<CollapsibleSectionHeader
				count={entries.length}
				headingClassName={headingClassName}
				isCollapsed={isCollapsed}
				label={label}
				onToggle={() => onToggleCollapse(id)}
			/>

			{!isCollapsed && (
				<div className='mt-1 ml-2 border-border border-l-2 pl-2'>
					{entries.length > 0 ? (
						<div>
							{entries.map(entry => {
								if (entry.type === 'session') {
									return (
										<ReviewSessionItem
											entry={entry.data}
											key={`session-${entry.data.id}`}
											onReviewClick={onSessionClick}
										/>
									)
								}
								return (
									<ReviewItem
										entry={entry.data}
										key={`review-${entry.data.id}`}
										onReviewClick={onReviewClick}
										variant='default'
									/>
								)
							})}
						</div>
					) : (
						<p className='py-2 text-muted-foreground text-xs italic'>
							No reviews
						</p>
					)}
				</div>
			)}
		</div>
	)
}

function ScheduledCardContent({
	isLoading,
	isEmpty,
	sections,
	collapsedSections,
	onToggleCollapse,
	onSessionClick,
	onReviewClick
}: {
	isLoading: boolean
	isEmpty: boolean
	sections: Array<ScheduledSection>
	collapsedSections: Record<string, boolean>
	onToggleCollapse: (sectionId: string) => void
	onSessionClick: (sessionId: number) => void
	onReviewClick: (reviewId: number) => void
}) {
	if (isLoading) {
		return <ScheduledCardSkeleton />
	}

	if (isEmpty) {
		return <p className='text-muted-foreground text-sm'>No scheduled reviews</p>
	}

	return (
		<div className='space-y-4'>
			{sections.map(section => (
				<HomeScheduledSection
					entries={section.entries}
					headingClassName={section.headingClassName}
					id={section.id}
					isCollapsed={collapsedSections[section.id] ?? false}
					key={section.id}
					label={section.label}
					onReviewClick={onReviewClick}
					onSessionClick={onSessionClick}
					onToggleCollapse={onToggleCollapse}
				/>
			))}
		</div>
	)
}

function ScheduledCardSkeleton() {
	return (
		<div className='space-y-4'>
			{[1, 2, 3].map(i => (
				<div className='space-y-2' key={i}>
					<Skeleton className='h-5 w-24' />
					<div className='ml-4 space-y-2'>
						<Skeleton className='h-12 w-full' />
						<Skeleton className='h-12 w-full' />
					</div>
				</div>
			))}
		</div>
	)
}

// ============================================================================
// HomeReviewCard - Shows topics by retrievability bucket (20 items max)
// ============================================================================

type BucketSection = {
	id: RetrievabilityBucket
	label: string
	headingClassName: string
	topics: Array<Topic>
}

function HomeReviewCard() {
	const navigate = useNavigate()
	const { data: topics, isLoading } = useTopics({
		hasStability: true,
		srsEnabled: true,
		archived: false
	})

	const { collapsedSections, toggleSection } = useSectionCollapse()

	// Group topics by retrievability bucket and limit to 20 total
	const sections = useMemo(() => {
		const late: Array<Topic> = []
		const onTime: Array<Topic> = []
		const early: Array<Topic> = []

		for (const topic of topics ?? []) {
			if (topic.retrievability === null) continue

			const bucket = getRetrievabilityBucket(topic.retrievability)
			switch (bucket) {
				case 'late':
					late.push(topic)
					break
				case 'onTime':
					onTime.push(topic)
					break
				case 'early':
					early.push(topic)
					break
				default:
					bucket satisfies never
			}
		}

		// Sort each bucket by retrievability (lowest first)
		const sortByRetrievability = (a: Topic, b: Topic) =>
			(a.retrievability ?? 0) - (b.retrievability ?? 0)
		late.sort(sortByRetrievability)
		onTime.sort(sortByRetrievability)
		early.sort(sortByRetrievability)

		const allBuckets: Array<BucketSection> = [
			{
				id: 'late',
				label: 'Late',
				headingClassName: 'text-red-600 dark:text-red-400',
				topics: late
			},
			{
				id: 'onTime',
				label: 'Ready',
				headingClassName: 'text-blue-600 dark:text-blue-400',
				topics: onTime
			},
			{
				id: 'early',
				label: 'Early',
				headingClassName: 'text-green-600 dark:text-green-400',
				topics: early
			}
		]

		return limitSections(
			allBuckets,
			REVIEW_LIMIT,
			s => s.topics.length,
			(s, count) => ({ ...s, topics: s.topics.slice(0, count) })
		)
	}, [topics])

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: topic.id.toString() }
			})
		},
		[navigate]
	)

	const isEmpty = sections.every(section => section.topics.length === 0)

	return (
		<Card className='flex h-full flex-col'>
			<CardHeader>
				<CardHeaderLink icon={BookOpen} title='Review' to='/review' />
			</CardHeader>
			<CardContent className='max-h-160 overflow-y-auto'>
				<ReviewCardContent
					collapsedSections={collapsedSections}
					isEmpty={isEmpty}
					isLoading={isLoading}
					onToggleCollapse={toggleSection}
					onTopicClick={handleTopicClick}
					sections={sections}
				/>
			</CardContent>
		</Card>
	)
}

function HomeReviewSection({
	id,
	label,
	headingClassName,
	topics,
	isCollapsed,
	onToggleCollapse,
	onTopicClick
}: {
	id: string
	label: string
	headingClassName: string
	topics: Array<Topic>
	isCollapsed: boolean
	onToggleCollapse: (sectionId: string) => void
	onTopicClick: (topic: Topic) => void
}) {
	const estimateItemSize = useCallback((topic: Topic) => {
		// Base height + name height + notes height
		let height = 96
		if (topic.name) height += Math.min(topic.name.length / 30, 3) * 24
		if (topic.notes) height += Math.min(topic.notes.length / 50, 4) * 20
		return height
	}, [])

	const renderItem = useCallback(
		(topic: Topic) => (
			<TopicCard
				headerRight={<TopicActionMenu topic={topic} />}
				onTopicClick={onTopicClick}
				showLeavingSoon={true}
				topic={topic}
			/>
		),
		[onTopicClick]
	)

	const getItemKey = useCallback((topic: Topic) => topic.id, [])

	return (
		<div className='mb-2'>
			<CollapsibleSectionHeader
				count={topics.length}
				headingClassName={headingClassName}
				isCollapsed={isCollapsed}
				label={label}
				onToggle={() => onToggleCollapse(id)}
			/>

			{!isCollapsed && (
				<div className='mt-2 ml-5'>
					<MasonryLayout
						estimateItemSize={estimateItemSize}
						getItemKey={getItemKey}
						items={topics}
						minItemWidth={280}
						renderItem={renderItem}
					/>
				</div>
			)}
		</div>
	)
}

function ReviewCardContent({
	isLoading,
	isEmpty,
	sections,
	collapsedSections,
	onToggleCollapse,
	onTopicClick
}: {
	isLoading: boolean
	isEmpty: boolean
	sections: Array<BucketSection>
	collapsedSections: Record<string, boolean>
	onToggleCollapse: (sectionId: string) => void
	onTopicClick: (topic: Topic) => void
}) {
	if (isLoading) {
		return <ReviewCardSkeleton />
	}

	if (isEmpty) {
		return (
			<p className='text-muted-foreground text-sm'>
				No topics ready for review
			</p>
		)
	}

	return (
		<div className='space-y-4'>
			{sections.map(section => (
				<HomeReviewSection
					headingClassName={section.headingClassName}
					id={section.id}
					isCollapsed={collapsedSections[section.id] ?? false}
					key={section.id}
					label={section.label}
					onToggleCollapse={onToggleCollapse}
					onTopicClick={onTopicClick}
					topics={section.topics}
				/>
			))}
		</div>
	)
}

function ReviewCardSkeleton() {
	return (
		<div className='space-y-4'>
			{[1, 2, 3].map(i => (
				<div className='space-y-2' key={i}>
					<Skeleton className='h-5 w-24' />
					<div className='ml-4 space-y-2'>
						<Skeleton className='h-20 w-full' />
					</div>
				</div>
			))}
		</div>
	)
}

// ============================================================================
// HomeRecentCard - Shows recent topics in masonry layout (20 items max)
// ============================================================================

function HomeRecentCard() {
	const navigate = useNavigate()
	const { data: topics = [], isLoading } = useTopics({
		order: 'desc',
		limit: RECENT_LIMIT
	})

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: topic.id.toString() }
			})
		},
		[navigate]
	)

	const estimateItemSize = useCallback((topic: Topic) => {
		const baseHeight = 80
		const lineHeight = 10
		const numCharsPerLine = 30
		const newLine = 10

		const nameHeight =
			Math.floor(topic.name.length / numCharsPerLine) * lineHeight
		const notesHeight =
			Math.floor(topic.notes.length / numCharsPerLine) * lineHeight

		const calculatedHeight = baseHeight + nameHeight + newLine + notesHeight

		return Math.max(calculatedHeight, 96)
	}, [])

	const renderItem = useCallback(
		(topic: Topic) => (
			<TopicCard
				headerRight={<TopicActionMenu topic={topic} />}
				minHeight={96}
				onTopicClick={handleTopicClick}
				topic={topic}
			/>
		),
		[handleTopicClick]
	)

	const getItemKey = useCallback((topic: Topic) => topic.id, [])

	return (
		<Card>
			<CardHeader>
				<CardHeaderLink icon={History} title='Recent Topics' to='/recent' />
			</CardHeader>
			<CardContent>
				<RecentCardContent
					estimateItemSize={estimateItemSize}
					getItemKey={getItemKey}
					isLoading={isLoading}
					renderItem={renderItem}
					topics={topics}
				/>
			</CardContent>
		</Card>
	)
}

function RecentCardContent({
	isLoading,
	topics,
	estimateItemSize,
	getItemKey,
	renderItem
}: {
	isLoading: boolean
	topics: Array<Topic>
	estimateItemSize: (topic: Topic, index: number) => number
	getItemKey: (topic: Topic, index: number) => string | number
	renderItem: (topic: Topic, index: number) => ReactNode
}) {
	if (isLoading) {
		return <RecentCardSkeleton />
	}

	if (topics.length === 0) {
		return <p className='text-muted-foreground text-sm'>No recent topics</p>
	}

	return (
		<MasonryLayout
			estimateItemSize={estimateItemSize}
			gap={16}
			getItemKey={getItemKey}
			items={topics}
			minItemWidth={280}
			renderItem={renderItem}
		/>
	)
}

function RecentCardSkeleton() {
	return (
		<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
			{[1, 2, 3, 4, 5, 6].map(i => (
				<Skeleton className='h-24 w-full' key={i} />
			))}
		</div>
	)
}

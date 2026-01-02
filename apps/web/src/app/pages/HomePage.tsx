import { Link, useNavigate } from '@tanstack/react-router'
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

const SCHEDULED_LIMIT = 10
const REVIEW_LIMIT = 20
const RECENT_LIMIT = 20

export function HomePage() {
	return (
		<PageLayout>
			<PageLayout.Header icon={Home} title='Home' />
			<PageLayout.Content className='max-w-screen'>
				<div className='grid gap-4 md:grid-cols-2'>
					<HomeScheduledCard />
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
// HomeScheduledCard - Shows scheduled review entries (10 items max)
// ============================================================================

type ScheduledSection = {
	id: string
	label: string
	headingClassName?: string
	entries: Array<ReviewEntry>
}

function HomeScheduledCard() {
	const navigate = useNavigate()
	const { sections: todaySections, isLoading: todayLoading } =
		useTodayReviewEntries()
	const { sections: soonSections, isLoading: soonLoading } =
		useSoonReviewEntries()

	const { collapsedSections, toggleSection } = useSectionCollapse()
	const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)

	// Combine and limit entries to 10 total
	const { sections } = useMemo(() => {
		const allSections: Array<ScheduledSection> = []

		// Add today sections (Overdue, Today)
		for (const section of todaySections) {
			allSections.push({
				id: section.id,
				label: section.label,
				headingClassName: section.headingClassName,
				entries: section.entries
			})
		}

		// Add soon sections (Tomorrow, Next 7 Days)
		for (const section of soonSections) {
			allSections.push({
				id: section.id,
				label: section.label,
				headingClassName: section.headingClassName,
				entries: section.entries
			})
		}

		// Calculate total and apply limit
		let remaining = SCHEDULED_LIMIT
		const limitedSections: Array<ScheduledSection> = []

		for (const section of allSections) {
			if (remaining <= 0) continue

			const entriesToTake = Math.min(section.entries.length, remaining)
			if (entriesToTake > 0 || section.entries.length === 0) {
				limitedSections.push({
					...section,
					entries: section.entries.slice(0, entriesToTake)
				})
				remaining -= entriesToTake
			}
		}

		// Filter out empty sections
		const filteredSections = limitedSections.filter(
			section => section.entries.length > 0
		)

		return {
			sections: filteredSections
		}
	}, [todaySections, soonSections])

	const isLoading = todayLoading || soonLoading

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
					<Link
						className='-mx-2 -my-1 flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted/50'
						to='/upcoming'
					>
						<div className='flex items-center gap-2'>
							<Calendar className='h-5 w-5 text-muted-foreground' />
							<CardTitle>Scheduled</CardTitle>
						</div>
						<ChevronRight className='h-4 w-4 text-muted-foreground' />
					</Link>
				</CardHeader>
				<CardContent className='max-h-160 overflow-y-auto'>
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
			<Button
				className='flex items-center gap-2 p-0'
				onClick={() => onToggleCollapse(id)}
				variant='ghost'
			>
				<h3
					className={`font-semibold text-sm ${headingClassName ?? ''}`.trim()}
				>
					{label}{' '}
					<span className='text-muted-foreground'>({entries.length})</span>
				</h3>
				<ChevronDown
					className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
				/>
			</Button>

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
	const { sections } = useMemo(() => {
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
		late.sort((a, b) => (a.retrievability ?? 0) - (b.retrievability ?? 0))
		onTime.sort((a, b) => (a.retrievability ?? 0) - (b.retrievability ?? 0))
		early.sort((a, b) => (a.retrievability ?? 0) - (b.retrievability ?? 0))

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

		// Apply limit across all buckets
		let remaining = REVIEW_LIMIT
		const limitedBuckets: Array<BucketSection> = []

		for (const bucket of allBuckets) {
			const topicsToTake = Math.min(bucket.topics.length, remaining)
			limitedBuckets.push({
				...bucket,
				topics: bucket.topics.slice(0, topicsToTake)
			})
			remaining -= topicsToTake
		}

		// Filter out empty sections
		const filteredBuckets = limitedBuckets.filter(
			bucket => bucket.topics.length > 0
		)

		return {
			sections: filteredBuckets
		}
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
				<Link
					className='-mx-2 -my-1 flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted/50'
					to='/review'
				>
					<div className='flex items-center gap-2'>
						<BookOpen className='h-5 w-5 text-muted-foreground' />
						<CardTitle>Review</CardTitle>
					</div>
					<ChevronRight className='h-4 w-4 text-muted-foreground' />
				</Link>
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
			<Button
				className='flex items-center gap-2 p-0'
				onClick={() => onToggleCollapse(id)}
				variant='ghost'
			>
				<h3 className={`font-semibold text-sm ${headingClassName}`.trim()}>
					{label}{' '}
					<span className='text-muted-foreground'>({topics.length})</span>
				</h3>
				<ChevronDown
					className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
				/>
			</Button>

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
				<Link
					className='-mx-2 -my-1 flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted/50'
					to='/recent'
				>
					<div className='flex items-center gap-2'>
						<History className='h-5 w-5 text-muted-foreground' />
						<CardTitle>Recent Topics</CardTitle>
					</div>
					<ChevronRight className='h-4 w-4 text-muted-foreground' />
				</Link>
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

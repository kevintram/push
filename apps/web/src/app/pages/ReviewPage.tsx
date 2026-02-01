import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowUpRight, BookOpen, ChevronDown } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useReviewSessionPageHandlers } from '~/app/hooks/useReviewSessionPageHandlers'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardFooter } from '~/components/ui/Card'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { Skeleton } from '~/components/ui/Skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import {
	useTodaySchedulePreview,
	useUnscheduledReviewEntriesPreview,
	useUpcomingReviewEntriesPreview
} from '~/features/reviews/api/getReviewEntries'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import { ReviewSessionItem } from '~/features/reviews/components/ReviewSessionItem'
import type { ReviewEntry } from '~/features/reviews/types/review.types'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import {
	getRetrievabilityBucket,
	type RetrievabilityBucket
} from '~/utils/retrievability'

type BucketSection = {
	id: RetrievabilityBucket
	label: string
	headingClassName: string
	topics: Array<Topic>
}

const SCHEDULE_PREVIEW_LIMIT = 3

export function ReviewPage() {
	const navigate = useNavigate()
	const {
		handleSessionClick,
		handleReviewClick,
		selectedReviewId,
		closeReviewDialog
	} = useReviewSessionPageHandlers()
	const { data: topics, isLoading } = useTopics({
		hasStability: true,
		srsEnabled: true,
		archived: false
	})
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

	const { collapsedSections, toggleSection } = useSectionCollapse()

	// Group topics by retrievability bucket
	const bucketSections = useMemo((): Array<BucketSection> => {
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

		// Sort each bucket by retrievability (lowest first - topics closest to leaving bucket)
		late.sort((a, b) => (a.retrievability ?? 0) - (b.retrievability ?? 0))
		onTime.sort((a, b) => (a.retrievability ?? 0) - (b.retrievability ?? 0))
		early.sort((a, b) => (a.retrievability ?? 0) - (b.retrievability ?? 0))

		return [
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

	const isEmpty =
		!isLoading && bucketSections.every(section => section.topics.length === 0)

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
					<ScheduleCard
						onReviewClick={handleReviewClick}
						onSessionClick={handleSessionClick}
						tabs={scheduleTabs}
					/>

					{isLoading ? (
						<ReviewTopicsSkeleton />
					) : isEmpty ? (
						<ReviewTopicsEmpty />
					) : (
						bucketSections
							.filter(section => section.topics.length > 0)
							.map(section => (
								<ReadinessSection
									headingClassName={section.headingClassName}
									id={section.id}
									isCollapsed={collapsedSections[section.id] ?? false}
									key={section.id}
									label={section.label}
									onToggleCollapse={toggleSection}
									onTopicClick={handleTopicClick}
									topics={section.topics}
								/>
							))
					)}
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

function ReviewTopicsSkeleton() {
	return (
		<div className='flex flex-col gap-6'>
			{[1, 2, 3].map(i => (
				<div className='flex flex-col gap-4' key={i}>
					<Skeleton className='h-8 w-32' />
					<div className='ml-5 border-border border-l-2 pl-2'>
						<Skeleton className='h-32 w-full' />
					</div>
				</div>
			))}
		</div>
	)
}

function ReviewTopicsEmpty() {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant='icon'>
					<BookOpen />
				</EmptyMedia>
				<EmptyTitle>See topics up for review</EmptyTitle>
			</EmptyHeader>
		</Empty>
	)
}

function ScheduleCard({
	tabs,
	onSessionClick,
	onReviewClick
}: {
	tabs: Record<
		'today' | 'upcoming' | 'unscheduled',
		{
			value: string
			label: string
			viewAllTo: string
			totalCount: number
			entries: Array<ReviewEntry>
			isLoading: boolean
			emptyText: string
		}
	>
	onSessionClick: (sessionId: number) => void
	onReviewClick: (reviewId: number) => void
}) {
	const [activeTab, setActiveTab] = useState<keyof typeof tabs>('today')
	const activeConfig = tabs[activeTab]

	return (
		<div className='flex flex-col gap-1'>
			<h2 className='font-bold text-xl'>Schedule</h2>
			<Card className='gap-2'>
				<CardContent>
					<Tabs
						onValueChange={value => setActiveTab(value as keyof typeof tabs)}
						value={activeTab}
					>
						<TabsList className='w-fit'>
							<TabsTrigger value={tabs.today.value}>
								{tabs.today.label} <span>{tabs.today.totalCount}</span>
							</TabsTrigger>
							<TabsTrigger value={tabs.upcoming.value}>
								{tabs.upcoming.label} <span>{tabs.upcoming.totalCount}</span>
							</TabsTrigger>
							<TabsTrigger value={tabs.unscheduled.value}>
								{tabs.unscheduled.label}{' '}
								<span>{tabs.unscheduled.totalCount}</span>
							</TabsTrigger>
						</TabsList>

						<TabsContent value={tabs.today.value}>
							<ScheduleTabContent
								emptyText={tabs.today.emptyText}
								entries={tabs.today.entries}
								isLoading={tabs.today.isLoading}
								onReviewClick={onReviewClick}
								onSessionClick={onSessionClick}
							/>
						</TabsContent>
						<TabsContent value={tabs.upcoming.value}>
							<ScheduleTabContent
								emptyText={tabs.upcoming.emptyText}
								entries={tabs.upcoming.entries}
								isLoading={tabs.upcoming.isLoading}
								onReviewClick={onReviewClick}
								onSessionClick={onSessionClick}
							/>
						</TabsContent>
						<TabsContent value={tabs.unscheduled.value}>
							<ScheduleTabContent
								emptyText={tabs.unscheduled.emptyText}
								entries={tabs.unscheduled.entries}
								isLoading={tabs.unscheduled.isLoading}
								onReviewClick={onReviewClick}
								onSessionClick={onSessionClick}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
				{activeConfig.totalCount > SCHEDULE_PREVIEW_LIMIT && (
					<CardFooter className='justify-center pt-0'>
						<Button
							asChild={true}
							className='gap-1 text-muted-foreground hover:text-primary'
							size='sm'
							variant='ghost'
						>
							<Link to={activeConfig.viewAllTo}>
								View all
								<ArrowUpRight className='h-4 w-4' />
							</Link>
						</Button>
					</CardFooter>
				)}
			</Card>
		</div>
	)
}

function ScheduleTabContent({
	entries,
	isLoading,
	emptyText,
	onSessionClick,
	onReviewClick
}: {
	entries: Array<ReviewEntry>
	isLoading: boolean
	emptyText: string
	onSessionClick: (sessionId: number) => void
	onReviewClick: (reviewId: number) => void
}) {
	return (
		<div className='space-y-3'>
			{isLoading ? (
				<ScheduleEntriesSkeleton />
			) : entries.length === 0 ? (
				<p className='text-muted-foreground text-sm italic'>{emptyText}</p>
			) : (
				<ScheduleEntriesList
					entries={entries}
					onReviewClick={onReviewClick}
					onSessionClick={onSessionClick}
				/>
			)}
		</div>
	)
}

function ScheduleEntriesList({
	entries,
	onSessionClick,
	onReviewClick
}: {
	entries: Array<ReviewEntry>
	onSessionClick: (sessionId: number) => void
	onReviewClick: (reviewId: number) => void
}) {
	return (
		<div className='flex flex-col'>
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

function ReadinessSection({
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
			<div className='flex items-center justify-between'>
				<Button
					className='flex items-center gap-2 p-0'
					onClick={() => onToggleCollapse(id)}
					variant='ghost'
				>
					<h2 className={`font-bold text-xl ${headingClassName}`.trim()}>
						{label}{' '}
						<span className='text-muted-foreground'>({topics.length})</span>
					</h2>
					<ChevronDown
						className={`h-5 w-5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
					/>
				</Button>
			</div>

			{!isCollapsed && (
				<div className='mt-2 mb-10 ml-5'>
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

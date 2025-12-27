import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, Home, RotateCw } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { Skeleton } from '~/components/ui/Skeleton'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import {
	formatThresholdCrossing,
	getRetrievabilityBucket,
	getRetrievabilityBucketBgColor,
	getThresholdCrossingInfo,
	type RetrievabilityBucket
} from '~/utils/retrievability'

type BucketSection = {
	id: RetrievabilityBucket
	label: string
	headingClassName: string
	topics: Array<Topic>
}

export function ReadinessPage() {
	const navigate = useNavigate()
	const { data: topics, isLoading } = useTopics({
		hasStability: true,
		srsEnabled: true,
		archived: false
	})

	const { mutate: createTopic, isPending: isCreatingTopic } = useCreateTopic()
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
				label: 'Prime',
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

	const handleCreateTopic = useCallback(() => {
		createTopic(
			{ name: '', notes: '', archived: false, inboxed: true },
			{
				onSuccess: data => {
					navigate({
						to: '/topics/$topicId',
						params: { topicId: data.id.toString() }
					})
				}
			}
		)
	}, [createTopic, navigate])

	const isEmpty =
		!isLoading && bucketSections.every(section => section.topics.length === 0)

	if (isLoading) {
		return (
			<PageLayout>
				<PageLayout.Header icon={RotateCw} title='Readiness' />
				<PageLayout.Content>
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
				</PageLayout.Content>
			</PageLayout>
		)
	}

	if (isEmpty) {
		return (
			<PageLayout>
				<PageLayout.Header icon={RotateCw} title='Readiness' />
				<PageLayout.Content>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<RotateCw />
							</EmptyMedia>
							<EmptyTitle>No topics to review yet.</EmptyTitle>
							<EmptyDescription>
								Topics with SRS enabled will appear here after their first
								review.
							</EmptyDescription>
							<EmptyContent>
								<div className='flex gap-2'>
									<EmptyStateCreateTopicButton
										disabled={isCreatingTopic}
										onClick={handleCreateTopic}
									/>
									<Button
										onClick={() => navigate({ to: '/home' })}
										variant='outline'
									>
										<Home />
										Topics
									</Button>
								</div>
							</EmptyContent>
						</EmptyHeader>
					</Empty>
				</PageLayout.Content>
			</PageLayout>
		)
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={RotateCw} title='Readiness' />
			<PageLayout.Content>
				{bucketSections.map(section => (
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
				))}
			</PageLayout.Content>
		</PageLayout>
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
	const bgColor = getRetrievabilityBucketBgColor(id as RetrievabilityBucket)

	const estimateItemSize = useCallback((topic: Topic) => {
		// Base height + name height + notes height
		let height = 96
		if (topic.name) height += Math.min(topic.name.length / 30, 3) * 24
		if (topic.notes) height += Math.min(topic.notes.length / 50, 4) * 20
		return height
	}, [])

	const renderItem = useCallback(
		(topic: Topic) => (
			<TopicCardWithThreshold onTopicClick={onTopicClick} topic={topic} />
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
				<div className='mt-2 mb-10 ml-5 border-border border-l-2 pl-2'>
					{topics.length > 0 ? (
						<div className={`rounded-lg p-4 ${bgColor}`}>
							<MasonryLayout
								estimateItemSize={estimateItemSize}
								getItemKey={getItemKey}
								items={topics}
								minItemWidth={280}
								renderItem={renderItem}
							/>
						</div>
					) : (
						<p className='px-4 text-muted-foreground text-sm italic'>
							No topics
						</p>
					)}
				</div>
			)}
		</div>
	)
}

function TopicCardWithThreshold({
	topic,
	onTopicClick
}: {
	topic: Topic
	onTopicClick: (topic: Topic) => void
}) {
	const thresholdInfo = useMemo(
		() =>
			getThresholdCrossingInfo(
				topic.retrievability,
				topic.stability,
				topic.last_reviewed_at
			),
		[topic.retrievability, topic.stability, topic.last_reviewed_at]
	)

	const thresholdText = useMemo(
		() => formatThresholdCrossing(thresholdInfo),
		[thresholdInfo]
	)

	const isLeavingSoon = thresholdInfo && thresholdInfo.daysUntil <= 7

	const footerExtra =
		thresholdText || isLeavingSoon ? (
			<>
				{thresholdText}
				{isLeavingSoon && (
					<Badge className='ml-1 text-xs' variant='destructive'>
						leaving soon
					</Badge>
				)}
			</>
		) : undefined

	return (
		<TopicCard
			footerExtra={footerExtra}
			headerRight={<TopicActionMenu topic={topic} />}
			onTopicClick={onTopicClick}
			showBucketLabel={false}
			topic={topic}
		/>
	)
}

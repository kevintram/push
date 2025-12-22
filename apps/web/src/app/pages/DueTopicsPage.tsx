import { useNavigate } from '@tanstack/react-router'
import { Home, RotateCw } from 'lucide-react'
import { useCallback, useMemo } from 'react'
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

type BucketColumn = {
	bucket: RetrievabilityBucket
	label: string
	topics: Array<Topic>
}

export function DueTopicsPage() {
	const navigate = useNavigate()
	const { data: topics, isLoading } = useTopics({
		hasStability: true,
		srsEnabled: true,
		archived: false
	})

	const { mutate: createTopic, isPending: isCreatingTopic } = useCreateTopic()

	// Group topics by retrievability bucket
	const bucketColumns = useMemo((): Array<BucketColumn> => {
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
			{ bucket: 'late', label: 'Late', topics: late },
			{ bucket: 'onTime', label: 'On Time', topics: onTime },
			{ bucket: 'early', label: 'Early', topics: early }
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
		!isLoading && bucketColumns.every(col => col.topics.length === 0)

	if (isLoading) {
		return (
			<PageLayout>
				<PageLayout.Header icon={RotateCw} title='Due Topics' />
				<PageLayout.Content>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
						{[1, 2, 3].map(i => (
							<div className='flex flex-col gap-4' key={i}>
								<Skeleton className='h-10 w-full' />
								<Skeleton className='h-32 w-full' />
								<Skeleton className='h-32 w-full' />
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
				<PageLayout.Header icon={RotateCw} title='Due Topics' />
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
			<PageLayout.Header icon={RotateCw} title='Due Topics' />
			<PageLayout.Content>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
					{bucketColumns.map(column => (
						<BucketColumnComponent
							column={column}
							key={column.bucket}
							onTopicClick={handleTopicClick}
						/>
					))}
				</div>
			</PageLayout.Content>
		</PageLayout>
	)
}

function BucketColumnComponent({
	column,
	onTopicClick
}: {
	column: BucketColumn
	onTopicClick: (topic: Topic) => void
}) {
	const bgColor = getRetrievabilityBucketBgColor(column.bucket)

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
		<div className='flex flex-col gap-2'>
			<div className={`sticky top-0 z-10 rounded-lg p-3 ${bgColor} border`}>
				<div className='flex items-center justify-between'>
					<h2 className='font-semibold text-sm'>{column.label}</h2>
					<Badge variant='secondary'>{column.topics.length}</Badge>
				</div>
			</div>
			{column.topics.length === 0 ? (
				<div className='rounded-lg border border-dashed p-4 text-center text-muted-foreground text-sm'>
					No topics in this category
				</div>
			) : (
				<MasonryLayout
					estimateItemSize={estimateItemSize}
					getItemKey={getItemKey}
					items={column.topics}
					minItemWidth={280}
					renderItem={renderItem}
				/>
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

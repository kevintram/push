import { useNavigate } from '@tanstack/react-router'
import { Plus, Tag } from 'lucide-react'
import { use, useCallback } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/Button'
import { TopicPanelHeader } from '~/components/ui/TopicPanelHeader'
import type { Topic } from '~/features/topics/types/topic.types'
import { ReviewContext } from '../../stores/SelectedReviewContext'
import type { Rating } from '../../types/review.types'
import { ReviewTopicCard } from './ReviewTopicCard'

const MIN_WIDTH = 210
const MIN_HEIGHT = 72

type ListItem = {
	type: 'topic'
	topic: Topic
	rating?: Rating | null
	topicReviewId?: number
}

interface ReviewTopicsPanelProps {
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	onRemoveTopicReview: (topicReviewId: number) => void
	onNavigate?: () => void | Promise<void>
}

export function ReviewTopicsPanel({
	getScrollElement,
	scrollMargin,
	onRemoveTopicReview,
	onNavigate
}: ReviewTopicsPanelProps) {
	const { review } = use(ReviewContext)
	const navigate = useNavigate()

	// Extract topics from reviews if available, otherwise fallback to topics
	const topics = review?.topic_reviews?.map(tr => tr.topic) ?? []

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: topic.id.toString() }
			})
			onNavigate?.()
		},
		[navigate, onNavigate]
	)

	const handleAddTopic = useCallback(() => {
		if (!review?.id) return
		navigate({
			to: '/reviews/$reviewId/add',
			params: { reviewId: review.id.toString() },
			search: { q: undefined }
		})
	}, [navigate, review?.id])

	const items: Array<ListItem> = review?.topic_reviews
		? review.topic_reviews.map(tr => ({
				type: 'topic' as const,
				topic: tr.topic,
				rating: tr.rating,
				topicReviewId: tr.id
			}))
		: []

	const estimateItemSize = useCallback((item: ListItem) => {
		const { topic } = item
		const baseHeight = 80
		const lineHeight = 10
		const numCharsPerLine = 30
		const newLine = 10

		const nameHeight =
			Math.floor(topic.name.length / numCharsPerLine) * lineHeight
		const notesHeight =
			Math.floor(topic.notes.length / numCharsPerLine) * lineHeight

		const calculatedHeight = baseHeight + nameHeight + newLine + notesHeight

		return Math.max(calculatedHeight, MIN_HEIGHT)
	}, [])

	const renderItem = useCallback(
		(item: ListItem) => {
			if (!(review && item.topicReviewId)) return null

			return (
				<ReviewTopicCard
					minHeight={MIN_HEIGHT}
					onNavigate={onNavigate}
					onRemoveFromReview={onRemoveTopicReview}
					onTopicClick={handleTopicClick}
					rating={item.rating}
					topic={item.topic}
					topicReviewId={item.topicReviewId}
				/>
			)
		},
		[handleTopicClick, onNavigate, onRemoveTopicReview, review]
	)

	const getItemKey = useCallback((item: ListItem, _index: number) => {
		return item.topic.id
	}, [])

	return (
		<div className='flex flex-col'>
			<TopicPanelHeader
				actions={
					<Button
						className='gap-1'
						onClick={handleAddTopic}
						size='sm'
						variant='secondary'
					>
						<Plus />
						Add
					</Button>
				}
				label={
					<Button
						className='flex items-center gap-2 p-0'
						onClick={handleAddTopic}
						variant='link'
					>
						<Tag className='h-4 w-4' />
						<span className='font-medium text-md text-muted-foreground'>
							Topics covered ({topics.length})
						</span>
					</Button>
				}
			/>
			<div className='flex-1 py-6'>
				<MasonryLayout
					estimateItemSize={estimateItemSize}
					gap={16}
					getItemKey={getItemKey}
					getScrollElement={getScrollElement}
					items={items}
					minItemWidth={MIN_WIDTH}
					renderItem={renderItem}
					scrollMargin={scrollMargin}
				/>
			</div>
		</div>
	)
}

import { Plus } from 'lucide-react'
import { use, useCallback } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { Button } from '~/components/ui/Button'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Rating, Topic } from '~/models/review-topic.types'
import { ReviewContext } from '../../stores/SelectedReviewContext'

const MIN_WIDTH = 210
const MIN_HEIGHT = 96

type ListItem = {
	type: 'topic'
	topic: Topic
	rating?: Rating | null
	topicReviewId?: number
}

interface ReviewTopicsPanelProps {
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	onAddTopic: () => void
	onRemoveTopicReview: (topicReviewId: number) => void
}

export function ReviewTopicsPanel({
	getScrollElement,
	scrollMargin,
	onAddTopic,
	onRemoveTopicReview
}: ReviewTopicsPanelProps) {
	const { review } = use(ReviewContext)
	const { openTopicDialog } = useReviewTopicDialog()

	// Extract topics from reviews if available, otherwise fallback to topics
	const topics =
		review?.topic_reviews?.map(tr => tr.topic) ?? review?.topics ?? []

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			openTopicDialog(topic.id)
		},
		[openTopicDialog]
	)

	const items: Array<ListItem> = review?.topic_reviews
		? review.topic_reviews.map(tr => ({
				type: 'topic' as const,
				topic: tr.topic,
				rating: tr.rating,
				topicReviewId: tr.id
			}))
		: (review?.topics ?? []).map(topic => ({
				type: 'topic' as const,
				topic
			}))

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
				<TopicCard
					minHeight={MIN_HEIGHT}
					onRemoveRelationship={() => onRemoveTopicReview(item.topicReviewId!)}
					onTopicClick={handleTopicClick}
					rating={item.rating}
					removeRelationshipText='Remove from review'
					reviewId={item.topicReviewId}
					reviews={item.topic.reviews ?? []}
					topic={item.topic}
				/>
			)
		},
		[handleTopicClick, onRemoveTopicReview, review]
	)

	const getItemKey = useCallback((item: ListItem, _index: number) => {
		return item.topic.id
	}, [])

	return (
		<div className='flex flex-col'>
			<div className='mb-3 flex items-center gap-2'>
				<span className='font-medium text-muted-foreground text-xs'>
					Topics ({topics.length})
				</span>
				<div className='flex-1' />
				<Button onClick={onAddTopic} size='icon-sm' variant='ghost'>
					<Plus />
				</Button>
			</div>
			<div className='flex-1'>
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

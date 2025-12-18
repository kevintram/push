import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/Button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import { useDeleteReview } from '~/features/reviews/api/deleteReview'
import type { Topic } from '~/features/topics/types/topic.types'
import type { Review } from '../../types/review.types'
import { ReviewTopicCard } from '../ReviewDetail/ReviewTopicCard'
import { useAddTopicToReview } from './AddTopicToReviewContext'

const MIN_HEIGHT = 72

interface AddedTopicsPopoverProps {
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	onTopicClick: (topic: Topic) => void
}

export function AddedTopicsPopover({
	isOpen,
	onOpenChange,
	onTopicClick
}: AddedTopicsPopoverProps) {
	const { review } = useAddTopicToReview()
	const deleteReviewMutation = useDeleteReview()
	const topicReviews = review?.reviews
	const addedTopicsCount = topicReviews?.length ?? 0

	const handleRemoveReview = (topicReviewId: number) => {
		deleteReviewMutation.mutateAsync(topicReviewId)
	}

	return (
		<Popover onOpenChange={onOpenChange} open={isOpen}>
			<PopoverTrigger asChild={true}>
				<Button
					className='px-0 font-semibold text-md'
					onClick={e => {
						e.stopPropagation()
						onOpenChange(!isOpen)
					}}
					size='default'
					variant='link'
				>
					{addedTopicsCount} topic{addedTopicsCount === 1 ? '' : 's'} added to
					review
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align='start'
				className='max-h-[500px] min-h-[350px] w-[600px] overflow-y-auto bg-background p-4'
				onClick={e => e.stopPropagation()}
				side='bottom'
			>
				{topicReviews && topicReviews.length > 0 ? (
					<MasonryLayout
						estimateItemSize={(tr: Review) => {
							const topic = tr.topic
							const nameLines = Math.ceil((topic.name?.length || 8) / 40)
							const notesLines = topic.notes
								? Math.min(2, Math.ceil(topic.notes.length / 40))
								: 0
							return Math.max(
								MIN_HEIGHT,
								72 + (nameLines - 1) * 20 + notesLines * 20
							)
						}}
						gap={12}
						getItemKey={(tr: Review) => tr.id}
						items={topicReviews}
						minItemWidth={250}
						renderItem={(topicReview: Review) => (
							<ReviewTopicCard
								minHeight={MIN_HEIGHT}
								onRemoveFromReview={handleRemoveReview}
								onTopicClick={onTopicClick}
								rating={topicReview.rating}
								topic={topicReview.topic}
								topicReviewId={topicReview.id}
							/>
						)}
					/>
				) : (
					<div className='py-8 text-center text-muted-foreground'>
						No topics
					</div>
				)}
			</PopoverContent>
		</Popover>
	)
}

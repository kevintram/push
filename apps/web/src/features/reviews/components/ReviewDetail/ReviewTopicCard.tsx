import { ChevronDown, GitPullRequestClosed } from 'lucide-react'
import { useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useUpdateTopicReview } from '~/features/reviews/api/updateTopicReview'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import { getRatingIcon } from '~/utils/getRatingIcon'
import type { Rating } from '../../types/review.types'

interface ReviewTopicCardProps {
	topic: Topic
	rating?: Rating | null
	topicReviewId: number
	onTopicClick?: (topic: Topic) => void
	onRemoveFromReview?: (topicReviewId: number) => void
	minHeight?: number
}

export function ReviewTopicCard({
	topic,
	rating,
	topicReviewId,
	onTopicClick,
	onRemoveFromReview,
	minHeight = 72
}: ReviewTopicCardProps) {
	const updateReviewMutation = useUpdateTopicReview()

	const handleRatingChange = useCallback(
		async (newRating: Rating) => {
			if (!topicReviewId) return
			await updateReviewMutation.mutateAsync({
				id: topicReviewId,
				rating: newRating
			})
		},
		[topicReviewId, updateReviewMutation]
	)

	const handleRemoveFromReview = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation()
			onRemoveFromReview?.(topicReviewId)
		},
		[onRemoveFromReview, topicReviewId]
	)

	return (
		<TopicCard
			additionalMenuItems={
				<DropdownMenuItem onClick={handleRemoveFromReview}>
					<GitPullRequestClosed className='mr-2 h-4 w-4' />
					Remove from review
				</DropdownMenuItem>
			}
			headerLeft={
				rating && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button
								className='gap-1 rounded-lg text-xs capitalize'
								onClick={e => e.stopPropagation()}
								size='sm'
								variant='outline'
							>
								{getRatingIcon(rating)}
								{rating}
								<ChevronDown className='h-3 w-3' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='start' side='bottom' sideOffset={2}>
							<DropdownMenuItem
								onClick={e => {
									e.stopPropagation()
									handleRatingChange('miss')
								}}
							>
								{getRatingIcon('miss')}
								<span className='ml-2 capitalize'>Miss</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={e => {
									e.stopPropagation()
									handleRatingChange('hard')
								}}
							>
								{getRatingIcon('hard')}
								<span className='ml-2 capitalize'>Hard</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={e => {
									e.stopPropagation()
									handleRatingChange('good')
								}}
							>
								{getRatingIcon('good')}
								<span className='ml-2 capitalize'>Good</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={e => {
									e.stopPropagation()
									handleRatingChange('easy')
								}}
							>
								{getRatingIcon('easy')}
								<span className='ml-2 capitalize'>Easy</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)
			}
			minHeight={minHeight}
			onTopicClick={onTopicClick}
			topic={topic}
		/>
	)
}

import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, GitPullRequestClosed } from 'lucide-react'
import { useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useUpdateReview } from '~/features/reviews/api/updateReview'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import { getRatingIcon } from '~/utils/getRatingIcon'
import type { Rating } from '../../types/review.types'

interface ReviewSessionTopicCardProps {
	topic: Topic
	rating?: Rating | null
	topicReviewId: number
	onTopicClick?: (topic: Topic) => void
	onRemoveFromReview?: (topicReviewId: number) => void
	onNavigate?: () => void | Promise<void>
	onTopicUpdateSuccess?: (updatedTopic: Topic) => void
	minHeight?: number
}

export function ReviewSessionTopicCard({
	topic,
	rating,
	topicReviewId,
	onTopicClick,
	onRemoveFromReview,
	onNavigate,
	onTopicUpdateSuccess,
	minHeight = 72
}: ReviewSessionTopicCardProps) {
	const navigate = useNavigate()
	const updateReviewMutation = useUpdateReview()

	const handleTopicClick = useCallback(
		(_clickedTopic: Topic) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: topic.id.toString() }
			})
			onNavigate?.()
			onTopicClick?.(_clickedTopic)
		},
		[navigate, topic.id, onNavigate, onTopicClick]
	)

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
			headerRight={
				<TopicActionMenu
					onTopicUpdateSuccess={onTopicUpdateSuccess}
					topic={topic}
				>
					<DropdownMenuItem onClick={handleRemoveFromReview}>
						<GitPullRequestClosed className='mr-2 h-4 w-4' />
						Remove from review
					</DropdownMenuItem>
				</TopicActionMenu>
			}
			minHeight={minHeight}
			onTopicClick={handleTopicClick}
			topic={topic}
		/>
	)
}

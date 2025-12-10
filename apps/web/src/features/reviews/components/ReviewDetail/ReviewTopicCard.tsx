import { useNavigate } from '@tanstack/react-router'
import {
	BookOpen,
	ChevronDown,
	GitPullRequestClosed,
	SquareArrowOutUpRight
} from 'lucide-react'
import { use, useCallback, useState } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import { useUpdateTopicReview } from '~/features/reviews/api/updateTopicReview'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import { getRatingIcon } from '~/utils/getRatingIcon'
import { ReviewContext } from '../../stores/SelectedReviewContext'
import type { Rating } from '../../types/review.types'

interface ReviewTopicCardProps {
	topic: Topic
	rating?: Rating | null
	topicReviewId: number
	onTopicClick?: (topic: Topic) => void
	onRemoveFromReview?: (topicReviewId: number) => void
	onNavigate?: () => void | Promise<void>
	minHeight?: number
}

export function ReviewTopicCard({
	topic,
	rating,
	topicReviewId,
	onTopicClick,
	onRemoveFromReview,
	onNavigate,
	minHeight = 72
}: ReviewTopicCardProps) {
	const { review } = use(ReviewContext)
	const navigate = useNavigate()
	const updateReviewMutation = useUpdateTopicReview()
	const [isOpenPopoverOpen, setIsOpenPopoverOpen] = useState(false)

	const handleOpenInReviewMode = useCallback(() => {
		if (!review?.id) return
		navigate({
			to: '/reviews/$reviewId/add/topics/$topicId',
			params: {
				reviewId: review.id.toString(),
				topicId: topic.id.toString()
			}
		})
		setIsOpenPopoverOpen(false)
		onNavigate?.()
	}, [navigate, review?.id, topic.id, onNavigate])

	const handleOpenRegular = useCallback(() => {
		navigate({
			to: '/topics/$topicId',
			params: { topicId: topic.id.toString() }
		})
		setIsOpenPopoverOpen(false)
		onNavigate?.()
	}, [navigate, topic.id, onNavigate])

	const handleTopicClick = useCallback(
		(clickedTopic: Topic) => {
			// If we have a review context, show the options popover
			if (review?.id) {
				setIsOpenPopoverOpen(true)
			} else {
				// Fallback to default behavior
				onTopicClick?.(clickedTopic)
			}
		},
		[review?.id, onTopicClick]
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
		<Popover onOpenChange={setIsOpenPopoverOpen} open={isOpenPopoverOpen}>
			<PopoverTrigger asChild={true}>
				<div>
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
									<DropdownMenuContent
										align='start'
										side='bottom'
										sideOffset={2}
									>
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
						onTopicClick={handleTopicClick}
						topic={topic}
					/>
				</div>
			</PopoverTrigger>
			<PopoverContent align='start' className='w-48 p-1' side='right'>
				<div className='flex flex-col gap-1'>
					<Button
						className='justify-start gap-2'
						onClick={handleOpenInReviewMode}
						size='sm'
						variant='ghost'
					>
						<BookOpen className='h-4 w-4' />
						Review mode
					</Button>
					<Button
						className='justify-start gap-2'
						onClick={handleOpenRegular}
						size='sm'
						variant='ghost'
					>
						<SquareArrowOutUpRight className='h-4 w-4' />
						Regular
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	)
}

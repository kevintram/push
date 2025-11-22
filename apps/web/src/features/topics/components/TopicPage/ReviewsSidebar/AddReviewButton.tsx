import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { use, useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { createReview } from '~/features/reviews/api'
import { createTopicReview } from '~/features/topic_reviews/api'
import { TopicContext } from '../../../stores/SelectedTopicContext'

export function AddReviewButton() {
	const { topic: selectedTopic } = use(TopicContext)
	const { openReviewDialog } = useReviewTopicDialog()

	const queryClient = useQueryClient()

	const { mutateAsync: createReviewMutation } = useMutation({
		mutationFn: createReview,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
		}
	})

	const { mutateAsync: createTopicReviewMutation } = useMutation({
		mutationFn: ({
			reviewId,
			topicId
		}: {
			reviewId: number
			topicId: number
		}) => createTopicReview(reviewId, topicId, 'good'),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
		}
	})

	const handleAddReview = useCallback(async () => {
		if (!selectedTopic) return

		const review = await createReviewMutation({
			description: '',
			scheduledAt: null,
			completedAt: null
		})

		await createTopicReviewMutation({
			reviewId: review.id,
			topicId: selectedTopic.id
		})
		openReviewDialog(review.id)
	}, [
		selectedTopic,
		createReviewMutation,
		createTopicReviewMutation,
		openReviewDialog
	])

	return (
		<Tooltip>
			<TooltipTrigger asChild={true}>
				<Button onClick={handleAddReview} size='sm' variant='ghost'>
					<Plus className='h-4 w-4' />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Add Review</TooltipContent>
		</Tooltip>
	)
}

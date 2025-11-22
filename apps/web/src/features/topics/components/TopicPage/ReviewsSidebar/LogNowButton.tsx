import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { BookCheck } from 'lucide-react'
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

export function LogNowButton() {
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

	const handleLogNow = useCallback(async () => {
		if (!selectedTopic) return

		const review = await createReviewMutation({
			description: '',
			scheduledAt: null,
			completedAt: dayjs().format('YYYY-MM-DD')
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
				<Button onClick={handleLogNow} size='sm' variant='ghost'>
					<BookCheck className='h-4 w-4' />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Log Now</TooltipContent>
		</Tooltip>
	)
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BookPlus } from 'lucide-react'
import { useCallback } from 'react'
import { SidebarMenuButton } from '~/components/ui/Sidebar'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { createReview } from '~/features/reviews/api'

export function AddReviewButton() {
	const { openReviewDialog } = useReviewTopicDialog()

	const queryClient = useQueryClient()

	const { mutateAsync: createReviewMutation } = useMutation({
		mutationFn: createReview,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
		}
	})

	const handleAddReview = useCallback(async () => {
		const review = await createReviewMutation({
			description: '',
			scheduledAt: null,
			completedAt: null
		})

		openReviewDialog(review.id)
	}, [createReviewMutation, openReviewDialog])

	return (
		<SidebarMenuButton
			onClick={handleAddReview}
			tooltip='Add Review'
			variant='secondary'
		>
			<BookPlus />
			<span>Add Review</span>
		</SidebarMenuButton>
	)
}

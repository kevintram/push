import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { BookCheck } from 'lucide-react'
import { useCallback } from 'react'
import { SidebarMenuButton } from '~/components/ui/Sidebar'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { createReview } from '~/features/reviews/api'

export function LogNowButton() {
	const { openReviewDialog } = useReviewTopicDialog()

	const queryClient = useQueryClient()

	const { mutateAsync: createReviewMutation } = useMutation({
		mutationFn: createReview,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
		}
	})

	const handleLogNow = useCallback(async () => {
		const review = await createReviewMutation({
			description: '',
			scheduledAt: null,
			completedAt: dayjs().format('YYYY-MM-DD')
		})

		openReviewDialog(review.id)
	}, [createReviewMutation, openReviewDialog])

	return (
		<SidebarMenuButton
			onClick={handleLogNow}
			tooltip='Log Review Now'
			variant='secondary'
		>
			<BookCheck />
			<span>Log Now</span>
		</SidebarMenuButton>
	)
}

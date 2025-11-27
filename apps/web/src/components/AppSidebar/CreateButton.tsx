import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ListChecks, Plus, SquarePen } from 'lucide-react'
import { useCallback } from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { SidebarMenuButton } from '~/components/ui/Sidebar'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { createReview } from '~/features/reviews/api'
import { useCreateTopicWithReview } from '~/features/topics/hooks/useCreateTopicWithReview'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'

export function CreateButton() {
	const { createTopicWithReview, isPending: isCreatingTopic } =
		useCreateTopicWithReview()
	const { openTopicDialog, openReviewDialog } = useReviewTopicDialog()
	const queryClient = useQueryClient()

	const { mutateAsync: createReviewMutation } = useMutation({
		mutationFn: createReview,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})

	const handleNewTopic = useCallback(async () => {
		const createdTopic = await createTopicWithReview({})
		openTopicDialog(createdTopic.id)
	}, [createTopicWithReview, openTopicDialog])

	const handleNewReview = useCallback(async () => {
		const review = await createReviewMutation({
			description: '',
			scheduledAt: null,
			completedAt: null
		})
		openReviewDialog(review.id)
	}, [createReviewMutation, openReviewDialog])

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild={true}>
				<SidebarMenuButton
					className='rounded-full'
					tooltip='Create new...'
					variant='secondary'
				>
					<Plus className='' />
					<span>Create</span>
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start' side='right'>
				<DropdownMenuItem onClick={handleNewReview}>
					<ListChecks />
					<span>New review</span>
				</DropdownMenuItem>
				<DropdownMenuItem disabled={isCreatingTopic} onClick={handleNewTopic}>
					<SquarePen />
					<span>New topic</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

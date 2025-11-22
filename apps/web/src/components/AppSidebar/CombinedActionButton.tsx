import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { BookCheck, Plus, SquarePen, SquarePlus } from 'lucide-react'
import { useCallback } from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { SidebarMenuButton } from '~/components/ui/Sidebar'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { createReview } from '~/features/reviews/api'
import { useCreateTopic } from '~/features/topics/api/useCreateTopic'

export function CombinedActionButton() {
	const { mutateAsync: insertTopic, isPending: isCreatingTopic } =
		useCreateTopic()
	const { openTopicDialog, openReviewDialog } = useReviewTopicDialog()
	const queryClient = useQueryClient()

	const { mutateAsync: createReviewMutation } = useMutation({
		mutationFn: createReview,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
		}
	})

	const handleCreateTopic = useCallback(async () => {
		const createdTopic = await insertTopic({})
		openTopicDialog(createdTopic.id)
	}, [insertTopic, openTopicDialog])

	const handleAddReview = useCallback(async () => {
		const review = await createReviewMutation({
			description: '',
			scheduledAt: null,
			completedAt: null
		})
		openReviewDialog(review.id)
	}, [createReviewMutation, openReviewDialog])

	const handleLogNow = useCallback(async () => {
		const review = await createReviewMutation({
			description: '',
			scheduledAt: null,
			completedAt: dayjs().format('YYYY-MM-DD')
		})
		openReviewDialog(review.id)
	}, [createReviewMutation, openReviewDialog])

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild={true}>
				<SidebarMenuButton
					tooltip='Add Topic, Review, or Log Now'
					variant='secondary'
				>
					<Plus />
					<span>Add</span>
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start'>
				<DropdownMenuItem
					disabled={isCreatingTopic}
					onClick={handleCreateTopic}
				>
					<SquarePen />
					<span>Add Topic</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleAddReview}>
					<SquarePlus />
					<span>Add Review</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleLogNow}>
					<BookCheck />
					<span>Log Review</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

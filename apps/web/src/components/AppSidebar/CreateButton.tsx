import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ListChecks, Plus, Square, SquareCheck, SquarePen } from 'lucide-react'
import { useCallback } from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { SidebarMenuButton } from '~/components/ui/Sidebar'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { createReview } from '~/features/reviews/api'
import { useCreateTopic } from '~/features/topics/api/useCreateTopic'

export function CreateButton() {
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

	const hanedleNewTopic = useCallback(async () => {
		const createdTopic = await insertTopic({})
		openTopicDialog(createdTopic.id)
	}, [insertTopic, openTopicDialog])

	const handleNewReviewNow = useCallback(async () => {
		const review = await createReviewMutation({
			description: '',
			scheduledAt: null,
			completedAt: dayjs().format('YYYY-MM-DD')
		})
		openReviewDialog(review.id)
	}, [createReviewMutation, openReviewDialog])

	const handleNewReviewLater = useCallback(async () => {
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
				<SidebarMenuButton tooltip='Create new...' variant='secondary'>
					<Plus />
					<span>Create</span>
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start' side='right'>
				<DropdownMenuItem disabled={isCreatingTopic} onClick={hanedleNewTopic}>
					<SquarePen />
					<span>New topic</span>
				</DropdownMenuItem>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<ListChecks />
						<span>New review</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuItem onClick={handleNewReviewNow}>
							<SquareCheck />
							<span>Now</span>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleNewReviewLater}>
							<Square />
							<span>Later</span>
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

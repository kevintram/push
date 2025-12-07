// React

// External libraries
import {
	ListChecks,
	Loader2,
	Plus,
	Square,
	SquareCheck,
	SquarePen
} from 'lucide-react'
import { useCallback } from 'react'

// UI Components
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

// Feature hooks
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateReview } from '~/features/reviews/hooks/useCreateReview'
import { useCreateTopicWithReview } from '~/features/topics/hooks/useCreateTopicWithReview'

export function CreateButton() {
	// Hooks
	const { createTopicWithReview, isTopicCreatePending: isCreatingTopic } =
		useCreateTopicWithReview()
	const { createReview, isPending: isCreatingReview } = useCreateReview()
	const { openTopicDialog, openReviewDialog } = useReviewTopicDialog()

	const isLoading = isCreatingTopic || isCreatingReview

	// Handlers
	const handleNewTopic = useCallback(async () => {
		const createdTopic = await createTopicWithReview({})
		openTopicDialog(createdTopic.id)
	}, [createTopicWithReview, openTopicDialog])

	const handleLogReviewNow = useCallback(async () => {
		const today = new Date().toISOString().split('T')[0]
		const review = await createReview({
			description: '',
			scheduledAt: null,
			completedAt: today
		})
		openReviewDialog(review.id)
	}, [createReview, openReviewDialog])

	const handleNewReviewForLater = useCallback(async () => {
		const review = await createReview({
			description: '',
			scheduledAt: null,
			completedAt: null
		})
		openReviewDialog(review.id)
	}, [createReview, openReviewDialog])

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild={true} disabled={isLoading}>
				<SidebarMenuButton
					className='rounded-full'
					disabled={isLoading}
					tooltip={isLoading ? 'Creating...' : 'Create new...'}
					variant='secondary'
				>
					{isLoading ? (
						<Loader2 className='animate-spin' />
					) : (
						<Plus className='' />
					)}
					<span>{isLoading ? 'Creating...' : 'Create'}</span>
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start' side='right'>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<ListChecks />
						<span>New review</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuItem onClick={handleLogReviewNow}>
							<SquareCheck />
							Log review now
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleNewReviewForLater}>
							<Square />
							For later
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				<DropdownMenuItem disabled={isLoading} onClick={handleNewTopic}>
					<SquarePen />
					<span>New topic</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

// React

// External libraries
import { useNavigate } from '@tanstack/react-router'
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
import { useCreateReviewSession } from '~/features/reviews/api/createReviewSession'
import { useCreateTopic } from '~/features/topics/api/createTopic'

export function CreateButton() {
	// Hooks
	const navigate = useNavigate()
	const { mutateAsync: createTopic, isPending: isCreatingTopic } =
		useCreateTopic()
	const { createReviewSession: createReview, isPending: isCreatingReview } =
		useCreateReviewSession()
	const { openTopicDialog } = useReviewTopicDialog()

	const isLoading = isCreatingTopic || isCreatingReview

	// Handlers
	const handleNewTopic = useCallback(async () => {
		const createdTopic = await createTopic({ inboxed: true })
		openTopicDialog(createdTopic.id)
	}, [createTopic, openTopicDialog])

	const handleLogReviewNow = useCallback(async () => {
		const today = new Date().toISOString().split('T')[0]
		const review = await createReview({
			description: '',
			scheduledAt: null,
			completedAt: today
		})
		navigate({
			to: '/review-session/$reviewSessionId',
			params: { reviewSessionId: review.id.toString() }
		})
	}, [createReview, navigate])

	const handleNewReviewForLater = useCallback(async () => {
		const review = await createReview({
			description: '',
			scheduledAt: null,
			completedAt: null
		})
		navigate({
			to: '/review-session/$reviewSessionId',
			params: { reviewSessionId: review.id.toString() }
		})
	}, [createReview, navigate])

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

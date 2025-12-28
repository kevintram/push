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
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

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
import { useCreateReviewSession } from '~/features/reviews/api/createReviewSession'
import { AddTopicDialog } from '~/features/topics/components/AddTopicDialog'

export function CreateButton() {
	// Hooks
	const navigate = useNavigate()
	const { createReviewSession: createReview, isPending: isCreatingReview } =
		useCreateReviewSession()

	// State for AddTopicDialog
	const [isAddTopicDialogOpen, setIsAddTopicDialogOpen] = useState(false)

	const isLoading = isCreatingReview

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
				<DropdownMenuItem
					disabled={isLoading}
					onClick={() => setIsAddTopicDialogOpen(true)}
				>
					<SquarePen />
					<span>New topic</span>
				</DropdownMenuItem>
			</DropdownMenuContent>

			<AddTopicDialog
				context={{ type: 'standalone' }}
				onOpenChange={setIsAddTopicDialogOpen}
				onSuccess={topicId => {
					toast('Topic created', {
						action: {
							label: 'Open',
							onClick: () =>
								navigate({
									to: '/topics/$topicId',
									params: { topicId: topicId.toString() }
								})
						}
					})
				}}
				open={isAddTopicDialogOpen}
			/>
		</DropdownMenu>
	)
}

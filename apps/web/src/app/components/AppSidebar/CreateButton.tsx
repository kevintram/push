// React

// External libraries
import { useNavigate } from '@tanstack/react-router'
import {
	Dumbbell,
	FileText,
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
import { AddPracticeDialog } from '~/features/practices/components/AddPracticeDialog'
import { useCreateReviewSession } from '~/features/reviews/api/createReviewSession'
import { AddSourceDialog } from '~/features/sources/components/AddSourceDialog'
import { AddTopicDialog } from '~/features/topics/components/AddTopicDialog'

export function CreateButton() {
	// Hooks
	const navigate = useNavigate()
	const { createReviewSession: createReview, isPending: isCreatingReview } =
		useCreateReviewSession()

	// State for AddTopicDialog
	const [isAddTopicDialogOpen, setIsAddTopicDialogOpen] = useState(false)
	// State for AddSourceDialog
	const [isAddSourceDialogOpen, setIsAddSourceDialogOpen] = useState(false)
	// State for AddPracticeDialog
	const [isAddPracticeDialogOpen, setIsAddPracticeDialogOpen] = useState(false)

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
					className='bg-primary text-primary-foreground hover:bg-primary/90'
					disabled={isLoading}
					tooltip={isLoading ? 'Creating...' : 'Create new...'}
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
				<DropdownMenuItem
					disabled={isLoading}
					onClick={() => setIsAddSourceDialogOpen(true)}
				>
					<FileText />
					<span>New source</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					disabled={isLoading}
					onClick={() => setIsAddPracticeDialogOpen(true)}
				>
					<Dumbbell />
					<span>New practice</span>
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

			<AddSourceDialog
				context={{ type: 'standalone' }}
				onOpenChange={setIsAddSourceDialogOpen}
				onSuccess={sourceId => {
					toast('Source created', {
						action: {
							label: 'Open',
							onClick: () =>
								navigate({
									to: '/sources/$sourceId',
									params: { sourceId: sourceId.toString() }
								})
						}
					})
				}}
				open={isAddSourceDialogOpen}
			/>

			<AddPracticeDialog
				context={{ type: 'standalone' }}
				onOpenChange={setIsAddPracticeDialogOpen}
				onSuccess={practiceId => {
					toast('Practice created', {
						action: {
							label: 'Open',
							onClick: () =>
								navigate({
									to: '/practices/$practiceId',
									params: { practiceId: practiceId.toString() }
								})
						}
					})
				}}
				open={isAddPracticeDialogOpen}
			/>
		</DropdownMenu>
	)
}

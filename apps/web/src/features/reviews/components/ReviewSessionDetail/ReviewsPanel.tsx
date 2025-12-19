import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { use, useCallback, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Skeleton } from '~/components/ui/Skeleton'
import { TopicPanelHeader } from '~/components/ui/TopicPanelHeader'
import { useReviews } from '../../api/getReviews'
import { ReviewContext } from '../../stores/SelectedReviewContext'
import { ReviewDialog } from '../ReviewDialog'
import { ReviewItem } from '../ReviewItem'

export function ReviewSessionTopicsPanel() {
	const { review } = use(ReviewContext)
	const navigate = useNavigate()
	const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	const { data: reviews = [], isLoading } = useReviews({
		reviewSessionId: review?.id
	})

	const handleAddTopic = useCallback(() => {
		if (!review?.id) return
		navigate({
			to: '/review-session/$reviewSessionId/add',
			params: { reviewSessionId: review.id.toString() },
			search: { q: undefined }
		})
	}, [navigate, review?.id])

	const handleReviewClick = useCallback((reviewId: number) => {
		setSelectedReviewId(reviewId)
		setIsDialogOpen(true)
	}, [])

	return (
		<div className='flex flex-col'>
			<TopicPanelHeader
				actions={
					<Button
						className='gap-1'
						onClick={handleAddTopic}
						size='sm'
						variant='secondary'
					>
						<Plus />
						Add
					</Button>
				}
				label={
					<Button
						className='flex items-center gap-2 p-0'
						onClick={handleAddTopic}
						variant='link'
					>
						<span className='font-medium text-md text-muted-foreground'>
							Reviews ({reviews.length})
						</span>
					</Button>
				}
			/>
			<div className='flex flex-col'>
				{isLoading ? (
					<div className='flex flex-col gap-4'>
						{[0, 1, 2, 3].map(i => (
							<Skeleton className='h-20 w-full' key={i} />
						))}
					</div>
				) : (
					reviews.map(entry => (
						<ReviewItem
							entry={entry}
							key={entry.id}
							onReviewClick={handleReviewClick}
							variant='topic'
						/>
					))
				)}
			</div>
			<ReviewDialog
				onOpenChange={setIsDialogOpen}
				open={isDialogOpen}
				reviewId={selectedReviewId}
			/>
		</div>
	)
}

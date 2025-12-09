import { X } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { Dialog, DialogContent } from '~/components/ui/Dialog'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useReviewWithTopics } from '../api/getReview'
import { ReviewContext } from '../stores/SelectedReviewContext'
import { ReviewDetail } from './ReviewDetail/ReviewDetail'

export function ReviewDialog() {
	const { reviewDialogState, closeReviewDialog } = useReviewTopicDialog()
	const { isOpen, reviewId: selectedReviewId } = reviewDialogState
	const { review, isLoading } = useReviewWithTopics(selectedReviewId!)

	const handleDelete = useCallback(() => {
		closeReviewDialog()
	}, [closeReviewDialog])

	const handleNavigate = useCallback(() => {
		closeReviewDialog()
	}, [closeReviewDialog])

	const headerActions = useMemo(
		() => (
			<Button
				className='h-6 w-6 p-0 text-muted-foreground'
				onClick={closeReviewDialog}
				size='sm'
				variant='ghost'
			>
				<X className='h-4 w-4' />
			</Button>
		),
		[closeReviewDialog]
	)

	const contextValue = useMemo(
		() => ({
			review,
			isLoading
		}),
		[review, isLoading]
	)

	return (
		<Dialog onOpenChange={closeReviewDialog} open={isOpen}>
			<DialogContent
				className='h-full w-full p-0 md:max-h-[600px] md:max-w-[600px] lg:max-w-[700px]'
				showCloseButton={false}
			>
				<ReviewContext value={contextValue}>
					<ReviewDetail
						headerAfterActions={headerActions}
						onDelete={handleDelete}
						onNavigate={handleNavigate}
					/>
				</ReviewContext>
			</DialogContent>
		</Dialog>
	)
}

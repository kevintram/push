import { createContext, useCallback, useState } from 'react'
import { ReviewDialog } from '../components/ReviewDialog'

interface ReviewDialogContextValue {
	openReviewDialog: (reviewId: number) => void
	closeReviewDialog: () => void
}

export const ReviewDialogContext =
	createContext<ReviewDialogContextValue | null>(null)

export function ReviewDialogProvider({
	children
}: {
	children: React.ReactNode
}) {
	const [reviewId, setReviewId] = useState<number | null>(null)
	const [isOpen, setIsOpen] = useState(false)

	const openReviewDialog = useCallback((id: number) => {
		setReviewId(id)
		setIsOpen(true)
	}, [])

	const closeReviewDialog = useCallback(() => {
		setIsOpen(false)
		setReviewId(null)
	}, [])

	return (
		<ReviewDialogContext value={{ openReviewDialog, closeReviewDialog }}>
			{children}
			<ReviewDialog
				onOpenChange={open => !open && closeReviewDialog()}
				open={isOpen}
				reviewId={reviewId}
			/>
		</ReviewDialogContext>
	)
}

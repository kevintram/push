import { createContext, useCallback, useRef, useState } from 'react'
import { ReviewDialog } from '../components/ReviewDialog'

interface OpenReviewDialogOptions {
	onClose?: () => void
}

interface ReviewDialogContextValue {
	openReviewDialog: (
		reviewId: number,
		options?: OpenReviewDialogOptions
	) => void
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
	const onCloseCallbackRef = useRef<(() => void) | null>(null)

	const openReviewDialog = useCallback(
		(id: number, options?: OpenReviewDialogOptions) => {
			onCloseCallbackRef.current = options?.onClose ?? null
			setReviewId(id)
			setIsOpen(true)
		},
		[]
	)

	const closeReviewDialog = useCallback(() => {
		setIsOpen(false)
		setReviewId(null)
		onCloseCallbackRef.current?.()
		onCloseCallbackRef.current = null
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

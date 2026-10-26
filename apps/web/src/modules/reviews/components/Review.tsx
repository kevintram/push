import { useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import { Dialog } from '~/components/ui'

import { useReviewActions } from '../hooks/useReviewActions'
import { useReviewField } from '../hooks/useReviewField'
import type { Review as ReviewModel } from '../types/review.types'
import { ReviewDialog } from './ReviewDialog'
import { ReviewRow } from './ReviewRow'

type ReviewProps = {
	review: ReviewModel
}

export function Review({ review }: ReviewProps) {
	const [isOpen, setIsOpen] = useState(false)

	const {
		confirmDelete,
		isDeleteDialogOpen,
		isDeleting,
		setDate,
		setIsDeleteDialogOpen,
		setRating,
	} = useReviewActions(review)

	const descriptionField = useReviewField({
		errorMessage: 'Failed to update review description',
		field: 'description',
		reviewId: review._id,
		value: review.description,
	})
	const notesField = useReviewField({
		errorMessage: 'Failed to update review notes',
		field: 'notes',
		reviewId: review._id,
		value: review.notes,
	})
	const handleOpenChange = (open: boolean) => {
		if (!open) {
			descriptionField.flush()
			notesField.flush()
		}
		setIsOpen(open)
	}

	return (
		<>
			<Dialog open={isOpen} onOpenChange={handleOpenChange}>
				<ReviewRow
					onDelete={() => setIsDeleteDialogOpen(true)}
					onOpen={() => setIsOpen(true)}
					onSetRating={setRating}
					review={review}
				/>

				<ReviewDialog
					descriptionField={descriptionField}
					isOpen={isOpen}
					notesField={notesField}
					onClose={() => handleOpenChange(false)}
					onDelete={() => setIsDeleteDialogOpen(true)}
					onSetDate={setDate}
					onSetRating={setRating}
					review={review}
				/>
			</Dialog>

			<DeleteConfirmationDialog
				description='This review will be permanently deleted.'
				isPending={isDeleting}
				onConfirm={confirmDelete}
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				title='Delete review?'
			/>
		</>
	)
}

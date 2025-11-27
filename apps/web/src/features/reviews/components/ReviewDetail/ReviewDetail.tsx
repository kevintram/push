import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Checkbox } from '~/components/ui/Checkbox'
import { Textarea } from '~/components/ui/Textarea'
import { deleteTopicReview } from '~/features/topic_reviews/api'
import { isOverdue } from '~/features/topics/utils/isOverdue'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'
import { deleteReview as deleteReviewApi } from '../../api/deleteReview'
import { updateReview as updateReviewApi } from '../../api/updateReview'
import { ReviewContext } from '../../stores/SelectedReviewContext'
import { AddTopicToReviewDialog } from '../AddTopicToReviewDialog'
import { ReviewDetailHeader } from './ReviewDetailHeader'
import { ReviewDetailSkeleton } from './ReviewDetailSkeleton'
import { ReviewTopicsPanel } from './ReviewTopicsPanel'

interface ReviewDetailProps {
	onDelete?: () => void | Promise<void>
	headerActions?: ReactNode
}

export function ReviewDetail({ onDelete, headerActions }: ReviewDetailProps) {
	const { review, isLoading } = use(ReviewContext)
	const queryClient = useQueryClient()
	const [isAddTopicDialogOpen, setIsAddTopicDialogOpen] = useState(false)

	const { mutateAsync: updateReviewMutation } = useMutation({
		mutationFn: updateReviewApi,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})

	const { mutateAsync: deleteReviewMutation } = useMutation({
		mutationFn: deleteReviewApi,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
			if (onDelete) {
				await onDelete()
			}
		}
	})

	const { mutateAsync: deleteTopicReviewMutation } = useMutation({
		mutationFn: deleteTopicReview,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})

	const updateDescriptionMutation = useCallback(
		(newDescription: string) => {
			if (review?.id) {
				updateReviewMutation({ id: review.id, description: newDescription })
			}
		},
		[updateReviewMutation, review?.id]
	)

	const updateNotesMutation = useCallback(
		(newNotes: string) => {
			if (review?.id) {
				updateReviewMutation({ id: review.id, notes: newNotes })
			}
		},
		[updateReviewMutation, review?.id]
	)

	const handleDelete = useCallback(async () => {
		if (review?.id) {
			await deleteReviewMutation(review.id)
		}
	}, [deleteReviewMutation, review?.id])

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			if (review?.id) {
				updateReviewMutation({
					id: review.id,
					completed_at: checked ? dayjs().format('YYYY-MM-DD') : null
				})
			}
		},
		[review?.id, updateReviewMutation]
	)

	const handleRemoveTopicReview = useCallback(
		async (topicReviewId: number) => {
			await deleteTopicReviewMutation(topicReviewId)
		},
		[deleteTopicReviewMutation]
	)

	const handleAddTopic = useCallback(() => {
		setIsAddTopicDialogOpen(true)
	}, [])

	const handleDateChange = useCallback(
		(newDate: Date | null) => {
			if (review?.id) {
				const newDateString = newDate
					? dayjs(newDate).format('YYYY-MM-DD')
					: null
				if (review.completed_at) {
					updateReviewMutation({
						id: review.id,
						completed_at: newDateString
					})
				} else {
					updateReviewMutation({
						id: review.id,
						scheduled_at: newDateString
					})
				}
			}
		},
		[review?.id, review?.completed_at, updateReviewMutation]
	)

	const { value: description, onChange: onDescriptionChange } = useAutoSave({
		initialValue: review?.description ?? '',
		onSave: updateDescriptionMutation,
		key: `review-detail-${review?.id}`
	})

	const { value: notes, onChange: onNotesChange } = useAutoSave({
		initialValue: review?.notes ?? '',
		onSave: updateNotesMutation,
		key: `review-detail-notes-${review?.id}`
	})

	const isOverdueValue: boolean = useMemo(() => {
		return isOverdue({
			scheduled_at: review?.scheduled_at ?? null,
			isCompleted: review?.completed_at !== null
		})
	}, [review?.scheduled_at, review?.completed_at])

	const descriptionRef = useRef<HTMLTextAreaElement | null>(null)
	const [scrollContainerRef] = useResizeObserver<HTMLDivElement>()

	// focus on description whenever selected review changes
	useEffect(() => {
		if (descriptionRef.current) {
			descriptionRef.current.focus()
		}
	}, [review?.id])

	if (isLoading || !review) {
		return <ReviewDetailSkeleton />
	}

	return (
		<div className='flex min-h-0 flex-1 flex-col'>
			<div className='sticky top-0 z-10 w-full border-b'>
				<ReviewDetailHeader
					headerActions={headerActions}
					onDateChange={handleDateChange}
					onDelete={handleDelete}
					review={review}
				/>
			</div>

			<div
				className='scrollbar-track-transparent flex flex-1 gap-4 overflow-y-auto p-4'
				ref={scrollContainerRef}
			>
				<Checkbox
					checked={!!review.completed_at}
					className={`translate-y-[7px] ${isOverdueValue ? 'border-red-600 dark:border-red-700 dark:bg-red-700' : ''}`}
					onCheckedChange={handleCheckboxChange}
				/>
				<div className='flex-1'>
					<div className='pb-4'>
						<Textarea
							className='!bg-transparent break-word !text-xl m-0 min-h-0 w-full max-w-2xl resize-none overflow-hidden rounded-none border-none p-0 font-semibold focus:outline-none focus-visible:border-none focus-visible:ring-0'
							onChange={onDescriptionChange}
							placeholder='Description'
							ref={descriptionRef}
							spellCheck={false}
							value={description}
						/>
						<Textarea
							className='!bg-transparent m-0 w-full max-w-2xl resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
							name='notes'
							onChange={onNotesChange}
							placeholder='Notes'
							spellCheck={false}
							value={notes}
						/>
					</div>
					<div className='w-full flex-1'>
						<ReviewTopicsPanel
							getScrollElement={() => scrollContainerRef.current}
							onAddTopic={handleAddTopic}
							onRemoveTopicReview={handleRemoveTopicReview}
						/>
					</div>
				</div>
			</div>
			<AddTopicToReviewDialog
				onOpenChange={setIsAddTopicDialogOpen}
				open={isAddTopicDialogOpen}
				review={review}
			/>
		</div>
	)
}

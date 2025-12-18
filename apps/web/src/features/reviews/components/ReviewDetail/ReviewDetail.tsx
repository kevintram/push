import dayjs from 'dayjs'
import { CalendarIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Checkbox } from '~/components/ui/Checkbox'
import { Textarea } from '~/components/ui/Textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useDeleteReview } from '~/features/reviews/api/deleteReview'
import { isOverdue } from '~/features/topics/utils/isOverdue'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import { cn } from '~/lib/utils'
import { useDeleteReviewSession } from '../../api/deleteReviewSession'
import { useUpdateReviewSession } from '../../api/updateReviewSession'
import { ReviewContext } from '../../stores/SelectedReviewContext'
import { DatePickerDropdown } from '../DatePickerDropdown'
import { ReviewDetailHeader } from './ReviewDetailHeader'
import { ReviewDetailSkeleton } from './ReviewDetailSkeleton'
import { ReviewTopicsPanel } from './ReviewTopicsPanel'

interface ReviewDetailProps {
	onDelete?: () => void | Promise<void>
	onNavigate?: () => void | Promise<void>
	/**
	 * Content to render in the left section (e.g., navigation buttons)
	 */
	headerBeforeActions?: ReactNode
	/**
	 * Content to render after the "more" dropdown (e.g., close/minimize buttons)
	 */
	headerAfterActions?: ReactNode
	/**
	 * Optional className to apply to the scroll container
	 */
	className?: string
}

export function ReviewDetail({
	onDelete,
	onNavigate,
	headerBeforeActions,
	headerAfterActions,
	className
}: ReviewDetailProps) {
	const { review, isLoading } = use(ReviewContext)
	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)

	const updateReviewMutation = useUpdateReviewSession()
	const deleteReviewSessionMutation = useDeleteReviewSession()
	const deleteReviewMutation = useDeleteReview()

	const handleDeleteReview = useCallback(
		async (reviewId: number) => {
			await deleteReviewSessionMutation.mutateAsync(reviewId)
			onDelete?.()
		},
		[deleteReviewSessionMutation, onDelete]
	)

	const updateDescriptionMutation = useCallback(
		(newDescription: string) => {
			if (review?.id) {
				updateReviewMutation.mutateAsync({
					id: review.id,
					description: newDescription
				})
			}
		},
		[updateReviewMutation, review?.id]
	)

	const updateNotesMutation = useCallback(
		(newNotes: string) => {
			if (review?.id) {
				updateReviewMutation.mutateAsync({ id: review.id, notes: newNotes })
			}
		},
		[updateReviewMutation, review?.id]
	)

	const handleDelete = useCallback(async () => {
		if (review?.id) {
			await handleDeleteReview(review.id)
		}
	}, [handleDeleteReview, review?.id])

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			if (review?.id) {
				updateReviewMutation.mutateAsync({
					id: review.id,
					completed_at: checked ? dayjs().format('YYYY-MM-DD') : null
				})
			}
		},
		[review?.id, updateReviewMutation]
	)

	const handleRemoveReview = useCallback(
		async (topicReviewId: number) => {
			await deleteReviewMutation.mutateAsync(topicReviewId)
		},
		[deleteReviewMutation]
	)

	const handleDateChange = useCallback(
		(newDate: Date | null) => {
			if (review?.id) {
				const newDateString = newDate
					? dayjs(newDate).format('YYYY-MM-DD')
					: null
				if (review.completed_at) {
					updateReviewMutation.mutateAsync({
						id: review.id,
						completed_at: newDateString
					})
				} else {
					updateReviewMutation.mutateAsync({
						id: review.id,
						scheduled_at: newDateString
					})
				}
			}
			setIsDatePopoverOpen(false)
		},
		[review?.id, review?.completed_at, updateReviewMutation]
	)

	const selectedDate = (() => {
		if (review?.completed_at) {
			return dayjs(review.completed_at).toDate()
		}
		if (review?.scheduled_at) {
			return dayjs(review.scheduled_at).toDate()
		}
		return null
	})()

	const effectiveDate = review?.effective_date
		? dayjs(review.effective_date).toDate()
		: null

	const relativeDate = useMemo(() => {
		if (!effectiveDate) return 'No date'

		const today = dayjs().startOf('day')
		const dateDay = dayjs(effectiveDate).startOf('day')
		const diffDays = dateDay.diff(today, 'day')

		if (diffDays === 0) return 'Today'
		if (diffDays === 1) return 'Tomorrow'
		if (diffDays === -1) return 'Yesterday'
		if (diffDays < 0) return `${Math.abs(diffDays)}d ago`
		return `in ${diffDays}d`
	}, [effectiveDate])

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
		// biome-ignore lint/correctness/useExhaustiveDependencies: We want to focus when review changes
	}, [review?.id])

	if (isLoading || !review) {
		return <ReviewDetailSkeleton />
	}

	return (
		<div className='flex min-h-0 flex-1 flex-col'>
			<div className='sticky top-0 z-10 w-full border-b'>
				<ReviewDetailHeader
					headerAfterActions={headerAfterActions}
					headerBeforeActions={headerBeforeActions}
					onDelete={handleDelete}
				/>
			</div>

			<div
				className={cn(
					'scrollbar-track-transparent flex w-full flex-1 gap-4 overflow-y-auto p-4 ',
					className
				)}
				ref={scrollContainerRef}
			>
				<Checkbox
					checked={!!review.completed_at}
					className={`translate-y-0.5 ${isOverdueValue ? 'border-red-600 dark:border-red-700 dark:bg-red-700' : ''}`}
					onCheckedChange={handleCheckboxChange}
				/>
				<div className='flex-1'>
					<div className='flex items-start justify-between gap-4 pb-4'>
						<div className='flex flex-1 flex-col'>
							<Textarea
								className='!bg-transparent break-word m-0 min-h-0 w-full resize-none overflow-hidden rounded-none border-none p-0 font-bold shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
								onChange={onDescriptionChange}
								placeholder='Description'
								ref={descriptionRef}
								spellCheck={false}
								value={description}
							/>
							<Textarea
								className='!bg-transparent m-0 w-full resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
								name='notes'
								onChange={onNotesChange}
								placeholder='Notes'
								spellCheck={false}
								value={notes}
							/>
						</div>
						<Tooltip>
							<DatePickerDropdown
								isOpen={isDatePopoverOpen}
								onDateChange={handleDateChange}
								onOpenChange={setIsDatePopoverOpen}
								selectedDate={selectedDate}
								trigger={
									<TooltipTrigger asChild={true}>
										<Button
											className={cn(
												'-translate-y-1.5',
												isOverdueValue && 'text-red-600 dark:text-red-400',
												relativeDate === 'Today' &&
													'text-blue-600 dark:text-blue-400'
											)}
											size='sm'
											variant='ghost'
										>
											<CalendarIcon className='h-4 w-4' />
											<span className='text-sm'>{relativeDate}</span>
										</Button>
									</TooltipTrigger>
								}
							/>
							{effectiveDate && (
								<TooltipContent>
									{dayjs(effectiveDate).format('MMMM D, YYYY')}
								</TooltipContent>
							)}
						</Tooltip>
					</div>
					<div className='w-full flex-1'>
						<ReviewTopicsPanel
							getScrollElement={() => scrollContainerRef.current}
							onNavigate={onNavigate}
							onRemoveReview={handleRemoveReview}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

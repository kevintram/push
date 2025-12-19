import dayjs from 'dayjs'
import { CalendarIcon, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Dialog, DialogContent } from '~/components/ui/Dialog'
import { Skeleton } from '~/components/ui/Skeleton'
import { Textarea } from '~/components/ui/Textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { isOverdue } from '~/features/topics/utils/isOverdue'
import { useAutoSave } from '~/hooks/useAutoSave'
import { cn } from '~/lib/utils'
import { useDeleteReview } from '../api/deleteReview'
import { useReview } from '../api/getReviews'
import { useUpdateReview } from '../api/updateReview'
import { DatePickerDropdown } from './DatePickerDropdown'
import { ReviewDetailHeader } from './ReviewDetail/ReviewDetailHeader'
import {
	ReviewRatingCheckbox,
	type ReviewRatingState
} from './ReviewRatingCheckbox'

interface ReviewDialogProps {
	reviewId: number | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function ReviewDialog({
	reviewId,
	open,
	onOpenChange
}: ReviewDialogProps) {
	const { data: review, isLoading } = useReview(reviewId ?? undefined)
	const updateReviewMutation = useUpdateReview()
	const deleteReviewMutation = useDeleteReview()

	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)

	// Computed date values
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

	const isOverdueValue: boolean = useMemo(() => {
		return isOverdue({
			scheduled_at: review?.scheduled_at ?? null,
			isCompleted: review?.completed_at !== null
		})
	}, [review?.scheduled_at, review?.completed_at])

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

	const { value: description, onChange: onDescriptionChange } = useAutoSave({
		initialValue: review?.description ?? '',
		onSave: updateDescriptionMutation,
		key: `review-dialog-${review?.id}`
	})

	const reviewStatus: ReviewRatingState = useMemo(() => {
		if (!review?.completed_at) return 'uncompleted'
		return review.rating ?? 'good'
	}, [review?.completed_at, review?.rating])

	const handleStatusChange = useCallback(
		(status: ReviewRatingState) => {
			if (!review?.id) return
			if (status === 'uncompleted') {
				updateReviewMutation.mutateAsync({
					id: review.id,
					rating: null,
					completed_at: null
				})
				return
			}
			updateReviewMutation.mutateAsync({
				id: review.id,
				rating: status,
				completed_at: dayjs().format('YYYY-MM-DD')
			})
		},
		[review?.id, updateReviewMutation]
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

	const handleDelete = useCallback(async () => {
		if (review?.id) {
			await deleteReviewMutation.mutateAsync(review.id)
			onOpenChange(false)
		}
	}, [review?.id, deleteReviewMutation, onOpenChange])

	const headerActions = useMemo(
		() => (
			<>
				<Button
					className='h-6 w-6 p-0 text-muted-foreground'
					onClick={() => onOpenChange(false)}
					size='sm'
					variant='ghost'
				>
					<X className='h-4 w-4' />
				</Button>
			</>
		),
		[onOpenChange]
	)

	if (isLoading) {
		return (
			<Dialog onOpenChange={onOpenChange} open={open}>
				<DialogContent className='max-w-2xl' showCloseButton={false}>
					<div className='border-b px-2 py-1'>
						<Skeleton className='h-6 w-full' />
					</div>
					<div className='flex flex-col gap-4 px-6 pb-6'>
						<Skeleton className='h-10 w-full' />
						<Skeleton className='h-32 w-full' />
					</div>
				</DialogContent>
			</Dialog>
		)
	}

	if (!review) {
		return null
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='flex h-full w-full flex-col p-0 md:max-h-[600px] md:max-w-[600px] lg:max-w-[700px]'
				showCloseButton={false}
			>
				<div className='sticky top-0 z-10 w-full border-b'>
					<ReviewDetailHeader
						headerAfterActions={headerActions}
						onDelete={handleDelete}
					/>
				</div>

				<div className='flex flex-1 gap-4 px-4'>
					<ReviewRatingCheckbox
						className={`translate-y-0.5 ${isOverdueValue ? 'border-red-600 dark:border-red-700 dark:bg-red-700' : ''}`}
						disabled={isLoading || updateReviewMutation.isPending}
						onChange={handleStatusChange}
						value={reviewStatus}
					/>
					<div className='flex flex-1 flex-col'>
						<div className='flex items-start justify-between gap-4'>
							<div className='flex-1'>
								<Textarea
									className='!bg-transparent break-word m-0 min-h-0 w-full resize-none overflow-hidden rounded-none border-none p-0 font-bold shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
									onChange={onDescriptionChange}
									placeholder='Description'
									spellCheck={false}
									value={description}
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
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

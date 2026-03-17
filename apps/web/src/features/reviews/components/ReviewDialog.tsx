import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import {
	Anvil,
	CalendarIcon,
	ChevronDown,
	Link,
	Maximize2,
	Minimize2,
	MoreHorizontal,
	X
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Textarea } from '~/components/ui/textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { cn } from '~/lib/utils'
import { formatRelativeDate } from '~/utils/formatRelativeDate'
import { useDeleteReview } from '../api/deleteReview'
import { useReview } from '../api/getReviews'
import { useUpdateReview } from '../api/updateReview'
import { isOverdue } from '../utils/isOverdue'
import { DatePickerDropdown } from './DatePickerDropdown'
import {
	ReviewRatingCheckbox,
	type ReviewRatingState
} from './ReviewRatingCheckbox'

interface ReviewDialogProps {
	reviewId: number | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

// TODO: add tanstack routing to this?
export function ReviewDialog({
	reviewId,
	open,
	onOpenChange
}: ReviewDialogProps) {
	const { data: review, isLoading } = useReview(reviewId ?? undefined)
	const updateReviewMutation = useUpdateReview()
	const deleteReviewMutation = useDeleteReview()

	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
	const [isExpanded, setIsExpanded] = useState(false)

	useEffect(() => {
		if (open) return
		setIsExpanded(false)
		setIsDatePopoverOpen(false)
	}, [open])

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

	const relativeDate = formatRelativeDate(effectiveDate)

	const isOverdueValue: boolean = useMemo(() => {
		return isOverdue({
			scheduled_at: review?.scheduled_at ?? null,
			isCompleted: review?.completed_at !== null
		})
	}, [review?.scheduled_at, review?.completed_at])

	const updateDescriptionMutation = useCallback(
		(newDescription: string) => {
			if (review?.id) {
				updateReviewMutation.mutate({
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

	const updateNotesMutation = useCallback(
		(newNotes: string) => {
			if (review?.id) {
				updateReviewMutation.mutate({
					id: review.id,
					notes: newNotes
				})
			}
		},
		[updateReviewMutation, review?.id]
	)

	const { value: notes, onChange: onNotesChange } = useAutoSave({
		initialValue: review?.notes ?? '',
		onSave: updateNotesMutation,
		key: `review-dialog-notes-${review?.id}`
	})

	const reviewStatus: ReviewRatingState = useMemo(() => {
		if (!review?.completed_at) return 'uncompleted'
		return review.rating ?? 'good'
	}, [review?.completed_at, review?.rating])

	const stabilityChangeColorClass = useMemo(() => {
		if (review?.stability_after == null) {
			return ''
		}
		if (review?.stability_before == null) {
			return 'text-green-600 dark:text-green-400'
		}
		const roundedDelta = Math.round(
			review.stability_after - review.stability_before
		)
		if (roundedDelta >= 0) {
			return 'text-green-600 dark:text-green-400'
		}
		return 'text-red-600 dark:text-red-400'
	}, [review?.stability_after, review?.stability_before])
	const hasStability = review?.stability_after != null
	const hasDelta =
		review?.stability_after != null && review?.stability_before != null
	const stabilityAfterRounded = hasStability
		? Math.round(review.stability_after ?? 0)
		: 0
	const stabilityDeltaRounded = hasDelta
		? Math.round((review.stability_after ?? 0) - (review.stability_before ?? 0))
		: 0

	const getCardName = useCallback((): string => {
		if (review?.review_card) return review.review_card.prompt || 'Untitled card'
		return 'Unknown card'
	}, [review?.review_card])

	const handleStatusChange = useCallback(
		(status: ReviewRatingState) => {
			if (!review?.id) return
			if (status === 'uncompleted') {
				updateReviewMutation.mutate({
					id: review.id,
					rating: null,
					completed_at: null
				})
				return
			}
			updateReviewMutation.mutate({
				id: review.id,
				rating: status,
				completed_at: review.completed_at ?? dayjs().format('YYYY-MM-DD')
			})
		},
		[review?.id, review?.completed_at, updateReviewMutation]
	)

	const handleDateChange = useCallback(
		(newDate: Date | null) => {
			if (review?.id) {
				const newDateString = newDate
					? dayjs(newDate).format('YYYY-MM-DD')
					: null
				if (review.completed_at) {
					updateReviewMutation.mutate({
						id: review.id,
						completed_at: newDateString
					})
				} else {
					updateReviewMutation.mutate({
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

	const navigate = useNavigate()

	const handleOpenLinkedCard = useCallback(() => {
		if (!review?.review_card) return
		navigate({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: review.review_card.id.toString() },
			search: { tab: 'reviews' }
		})
	}, [navigate, review?.review_card])

	const handleDialogOpenChange = useCallback(
		(nextOpen: boolean) => {
			onOpenChange(nextOpen)
		},
		[onOpenChange]
	)

	const dialogContentClassName = useMemo(
		() =>
			cn(
				'-translate-x-1/2 fixed left-1/2 top-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-full translate-y-0 flex-col rounded-none p-0 sm:rounded-xl',
				isExpanded
					? 'sm:top-[5vh] sm:h-[90vh] sm:max-h-[90vh] sm:max-w-5xl lg:max-w-6xl'
					: 'sm:top-[10vh] sm:h-[400px] sm:max-h-[400px] sm:max-w-[540px] lg:max-w-[680px]'
			),
		[isExpanded]
	)

	const headerActions = useMemo(
		() => (
			<>
				<Button
					aria-label={
						isExpanded ? 'Collapse review dialog' : 'Expand review dialog'
					}
					className='hidden h-6 w-6 p-0 text-muted-foreground sm:inline-flex'
					onClick={() => setIsExpanded(previous => !previous)}
					size='sm'
					title={isExpanded ? 'Collapse dialog' : 'Expand dialog'}
					variant='ghost'
				>
					{isExpanded ? (
						<Minimize2 className='h-4 w-4' />
					) : (
						<Maximize2 className='h-4 w-4' />
					)}
				</Button>
				<Button
					aria-label='Close review dialog'
					className='h-6 w-6 p-0 text-muted-foreground'
					onClick={() => onOpenChange(false)}
					size='sm'
					title='Close dialog'
					variant='ghost'
				>
					<X className='h-4 w-4' />
				</Button>
			</>
		),
		[isExpanded, onOpenChange]
	)

	if (isLoading) {
		return (
			<Dialog onOpenChange={handleDialogOpenChange} open={open}>
				<DialogContent
					className={dialogContentClassName}
					showCloseButton={false}
				>
					<LoadingSpinner containerClassName='h-full min-h-48' />
				</DialogContent>
			</Dialog>
		)
	}

	if (!review) {
		return null
	}

	return (
		<Dialog onOpenChange={handleDialogOpenChange} open={open}>
			<DialogContent className={dialogContentClassName} showCloseButton={false}>
				<div className='flex h-full min-h-0 flex-col'>
					<div className='flex items-center justify-between border-b px-2 py-1'>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button
										className='max-w-48'
										disabled={updateReviewMutation.isPending}
										size='sm'
										title='Open card'
										variant='ghost'
									>
										<Link className='h-3.5 w-3.5 shrink-0' />
										<span className='truncate'>{getCardName()}</span>
										<ChevronDown className='h-3 w-3 shrink-0 text-muted-foreground' />
									</Button>
								}
							/>
							<DropdownMenuContent align='start' className='w-auto'>
								<DropdownMenuItem onClick={handleOpenLinkedCard}>
									Open card
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<div className='flex items-center gap-2'>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button
											className='h-6 w-6 p-0'
											size='sm'
											title='More options'
											variant='ghost'
										>
											<MoreHorizontal className='h-4 w-4' />
										</Button>
									}
								/>
								<DropdownMenuContent>
									<DropdownMenuItem
										onClick={handleDelete}
										variant='destructive'
									>
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							{headerActions}
						</div>
					</div>

					<ScrollArea
						className='min-h-0 flex-1'
						scrollbarClassName='p-px data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5'
					>
						<div className='flex min-h-full min-w-0 flex-col gap-y-2 px-4 py-4'>
							{hasStability && (
								<div className='flex items-center text-muted-foreground text-xs'>
									<Anvil className='mr-1 h-3 w-3' />
									<span>{stabilityAfterRounded}d</span>
									{hasDelta ? (
										<span className={cn('ml-1', stabilityChangeColorClass)}>
											({stabilityDeltaRounded >= 0 ? '+' : ''}
											{stabilityDeltaRounded})
										</span>
									) : (
										<span className={cn('ml-1', stabilityChangeColorClass)}>
											(new)
										</span>
									)}
								</div>
							)}
							<div className='grid min-h-0 flex-1 grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr] content-start items-center gap-x-2'>
								<ReviewRatingCheckbox
									className={cn(
										'ml-2',
										isOverdueValue &&
											'border-red-600 dark:border-red-700 dark:bg-red-700'
									)}
									disabled={isLoading || updateReviewMutation.isPending}
									onChange={handleStatusChange}
									value={reviewStatus}
								/>
								<Textarea
									className='!bg-transparent m-0 min-h-0 min-w-0 resize-none overflow-hidden rounded-none border-none p-0 font-bold shadow-none [overflow-wrap:anywhere] focus:outline-none focus-visible:border-none focus-visible:ring-0'
									onChange={onDescriptionChange}
									placeholder='Description'
									spellCheck={false}
									value={description}
								/>
								<DatePickerDropdown
									isOpen={isDatePopoverOpen}
									onDateChange={handleDateChange}
									onOpenChange={setIsDatePopoverOpen}
									selectedDate={selectedDate}
									trigger={
										<Button
											className={cn(
												'shrink-0 text-xs',
												isOverdueValue && 'text-red-600 dark:text-red-400',
												relativeDate.text === 'Today' &&
													'text-blue-600 dark:text-blue-400'
											)}
											size='sm'
											variant='ghost'
										>
											<CalendarIcon className='h-3 w-3' />
											{relativeDate.text}
										</Button>
									}
								/>
								<div className='self-start' />
								<Textarea
									className='!bg-transparent m-0 h-full min-h-0 min-w-0 resize-none rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
									onChange={onNotesChange}
									placeholder='Notes'
									spellCheck={false}
									value={notes}
								/>
							</div>
						</div>
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	)
}

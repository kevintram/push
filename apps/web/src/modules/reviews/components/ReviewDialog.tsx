import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import {
	Anvil,
	CalendarIcon,
	Maximize2,
	Minimize2,
	MoreHorizontal,
	X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '~/components/ui/button'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Textarea } from '~/components/ui/textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { cn } from '~/lib/utils'
import { getReviewCardDisplayTitle } from '~/modules/review-cards/utils/reviewCardCopy'
import { formatRelativeDate } from '~/utils/formatRelativeDate'

import { useDeleteReview } from '../api/deleteReview'
import { useReview } from '../api/getReviews'
import { useUpdateReview } from '../api/updateReview'
import { isOverdue } from '../utils/isOverdue'
import { DatePickerDropdown } from './DatePickerDropdown'
import {
	ReviewRatingCheckbox,
	type ReviewRatingState,
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
	onOpenChange,
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
		if (review?.completedAt) {
			return dayjs(review.completedAt).toDate()
		}
		if (review?.scheduledAt) {
			return dayjs(review.scheduledAt).toDate()
		}
		return null
	})()

	const effectiveDate = review?.effectiveDate
		? dayjs(review.effectiveDate).toDate()
		: null

	const relativeDate = formatRelativeDate(effectiveDate)

	const isOverdueValue: boolean = useMemo(
		() =>
			isOverdue({
				scheduledAt: review?.scheduledAt ?? null,
				isCompleted: review?.completedAt !== null,
			}),
		[review?.scheduledAt, review?.completedAt],
	)

	const updateDescriptionMutation = useCallback(
		(newDescription: string) => {
			if (review?.id) {
				updateReviewMutation.mutate({
					id: review.id,
					description: newDescription,
				})
			}
		},
		[updateReviewMutation, review?.id],
	)

	const { value: description, onChange: onDescriptionChange } = useAutoSave({
		initialValue: review?.description ?? '',
		onSave: updateDescriptionMutation,
		key: `review-dialog-${review?.id}`,
	})

	const updateNotesMutation = useCallback(
		(newNotes: string) => {
			if (review?.id) {
				updateReviewMutation.mutate({
					id: review.id,
					notes: newNotes,
				})
			}
		},
		[updateReviewMutation, review?.id],
	)

	const { value: notes, onChange: onNotesChange } = useAutoSave({
		initialValue: review?.notes ?? '',
		onSave: updateNotesMutation,
		key: `review-dialog-notes-${review?.id}`,
	})

	const reviewStatus: ReviewRatingState = useMemo(() => {
		if (!review?.completedAt) return 'uncompleted'
		return review.rating ?? 'good'
	}, [review?.completedAt, review?.rating])

	const stabilityChangeColorClass = useMemo(() => {
		if (review?.stabilityAfter == null) {
			return ''
		}
		if (review?.stabilityBefore == null) {
			return 'text-green-600 dark:text-green-400'
		}
		const roundedDelta = Math.round(
			review.stabilityAfter - review.stabilityBefore,
		)
		if (roundedDelta >= 0) {
			return 'text-green-600 dark:text-green-400'
		}
		return 'text-red-600 dark:text-red-400'
	}, [review?.stabilityAfter, review?.stabilityBefore])
	const hasStability = review?.stabilityAfter != null
	const hasDelta =
		review?.stabilityAfter != null && review?.stabilityBefore != null
	const stabilityAfterRounded = hasStability
		? Math.round(review.stabilityAfter ?? 0)
		: 0
	const stabilityDeltaRounded = hasDelta
		? Math.round(
				(review.stabilityAfter ?? 0) - (review.stabilityBefore ?? 0),
			)
		: 0

	const getCardName = useCallback((): string => {
		if (review?.reviewCard) {
			return getReviewCardDisplayTitle(review.reviewCard)
		}
		return 'Unknown card'
	}, [review?.reviewCard])

	const handleStatusChange = useCallback(
		(status: ReviewRatingState) => {
			if (!review?.id) return
			if (status === 'uncompleted') {
				updateReviewMutation.mutate({
					id: review.id,
					rating: null,
					completedAt: null,
				})
				return
			}
			updateReviewMutation.mutate({
				id: review.id,
				rating: status,
				completedAt: review.completedAt ?? dayjs().format('YYYY-MM-DD'),
			})
		},
		[review?.id, review?.completedAt, updateReviewMutation],
	)

	const handleDateChange = useCallback(
		(newDate: Date | null) => {
			if (review?.id) {
				const newDateString = newDate
					? dayjs(newDate).format('YYYY-MM-DD')
					: null
				if (review.completedAt) {
					updateReviewMutation.mutate({
						id: review.id,
						completedAt: newDateString,
					})
				} else {
					updateReviewMutation.mutate({
						id: review.id,
						scheduledAt: newDateString,
					})
				}
			}
			setIsDatePopoverOpen(false)
		},
		[review?.id, review?.completedAt, updateReviewMutation],
	)

	const handleDelete = useCallback(() => {
		if (review?.id) {
			onOpenChange(false)
			deleteReviewMutation.mutate(review.id)
		}
	}, [review?.id, deleteReviewMutation, onOpenChange])

	const navigate = useNavigate()

	const handleOpenLinkedCard = useCallback(() => {
		if (!review?.reviewCard) return
		onOpenChange(false)
		navigate({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: review.reviewCard.id.toString() },
			search: { tab: 'reviews' },
		})
	}, [navigate, review?.reviewCard, onOpenChange])

	const handleDialogOpenChange = useCallback(
		(nextOpen: boolean) => {
			onOpenChange(nextOpen)
		},
		[onOpenChange],
	)

	const dialogContentClassName = useMemo(
		() =>
			cn(
				'-translate-x-1/2 fixed left-1/2 top-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-full translate-y-0 flex-col rounded-none p-0 sm:rounded-xl',
				isExpanded
					? 'sm:top-[5vh] sm:h-[90vh] sm:max-h-[90vh] sm:max-w-5xl lg:max-w-6xl'
					: 'sm:top-[10vh] sm:h-[400px] sm:max-h-[400px] sm:max-w-[540px] lg:max-w-[680px]',
			),
		[isExpanded],
	)

	const headerActions = useMemo(
		() => (
			<>
				<Button
					aria-label={
						isExpanded
							? 'Collapse review dialog'
							: 'Expand review dialog'
					}
					className='hidden text-muted-foreground sm:inline-flex'
					onClick={() => setIsExpanded(previous => !previous)}
					size='icon-xs'
					title={isExpanded ? 'Collapse dialog' : 'Expand dialog'}
					variant='ghost'
				>
					{isExpanded ? <Minimize2 /> : <Maximize2 />}
				</Button>
				<Button
					aria-label='Close review dialog'
					className='text-muted-foreground'
					onClick={() => onOpenChange(false)}
					size='icon-xs'
					title='Close dialog'
					variant='ghost'
				>
					<X />
				</Button>
			</>
		),
		[isExpanded, onOpenChange],
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
			<DialogContent
				className={dialogContentClassName}
				showCloseButton={false}
			>
				<div className='flex h-full min-h-0 flex-col'>
					<div className='flex items-center justify-between border-b px-2 py-1'>
						<Button
							className='max-w-48'
							disabled={updateReviewMutation.isPending}
							onClick={handleOpenLinkedCard}
							size='sm'
							title='Open card'
							variant='ghost'
						>
							<span className='truncate'>{getCardName()}</span>
						</Button>
						<div className='flex items-center gap-2'>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button
											size='icon-xs'
											title='More options'
											variant='ghost'
										>
											<MoreHorizontal />
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
										<span
											className={cn(
												'ml-1',
												stabilityChangeColorClass,
											)}
										>
											(
											{stabilityDeltaRounded >= 0
												? '+'
												: ''}
											{stabilityDeltaRounded})
										</span>
									) : (
										<span
											className={cn(
												'ml-1',
												stabilityChangeColorClass,
											)}
										>
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
											'border-red-600 dark:border-red-700 dark:bg-red-700',
									)}
									disabled={
										isLoading ||
										updateReviewMutation.isPending
									}
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
												isOverdueValue &&
													'text-red-600 dark:text-red-400',
												relativeDate.text === 'Today' &&
													'text-blue-600 dark:text-blue-400',
											)}
											size='sm'
											variant='ghost'
										>
											<CalendarIcon />
											{relativeDate.text}
										</Button>
									}
								/>
								<div className='self-start' />
								<Textarea
									className='!bg-transparent m-0 h-full min-h-0 min-w-0 resize-none rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
									onChange={onNotesChange}
									placeholder='Add notes...'
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

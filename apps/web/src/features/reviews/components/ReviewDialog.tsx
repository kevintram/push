import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import {
	Anchor,
	CalendarIcon,
	ExternalLink,
	SquareStack,
	X
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Dialog, DialogContent } from '~/components/ui/Dialog'
import {
	Sidebar,
	SidebarHeader,
	SidebarHolder,
	SidebarProvider
} from '~/components/ui/Sidebar'
import { Skeleton } from '~/components/ui/Skeleton'
import { Textarea } from '~/components/ui/Textarea'
import { isOverdue } from '~/features/topics/utils/isOverdue'
import { useAutoSave } from '~/hooks/useAutoSave'
import { cn } from '~/lib/utils'
import { useDeleteReview } from '../api/deleteReview'
import { useReview } from '../api/getReviews'
import { useUpdateReview } from '../api/updateReview'
import { DatePickerDropdown } from './DatePickerDropdown'
import {
	ReviewRatingCheckbox,
	type ReviewRatingState
} from './ReviewRatingCheckbox'
import { ReviewSessionDetailHeader } from './ReviewSessionDetail/ReviewSessionDetailHeader'
import { SessionPickerPopover } from './SessionPickerPopover'

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
	const [isSessionPopoverOpen, setIsSessionPopoverOpen] = useState(false)

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

	const updateNotesMutation = useCallback(
		(newNotes: string) => {
			if (review?.id) {
				updateReviewMutation.mutateAsync({
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
		if (review?.stability_after == null || review?.stability_before == null) {
			return ''
		}
		if (review.stability_after > review.stability_before) {
			return 'text-green-600 dark:text-green-400'
		}
		if (review.stability_after < review.stability_before) {
			return 'text-red-600 dark:text-red-400'
		}
		return 'text-muted-foreground'
	}, [review?.stability_after, review?.stability_before])

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

	const navigate = useNavigate()

	const handleTopicClick = useCallback(() => {
		if (!review?.topic_id) return
		navigate({
			to: '/topics/$topicId',
			params: { topicId: review.topic_id.toString() }
		})
	}, [navigate, review?.topic_id])

	const handleSessionClick = useCallback(() => {
		if (!review?.review_session) return
		navigate({
			to: '/review-session/$reviewSessionId',
			params: { reviewSessionId: review.review_session.id.toString() }
		})
	}, [navigate, review?.review_session])

	const handleSessionChange = useCallback(
		(sessionId: number | null) => {
			if (review?.id) {
				updateReviewMutation.mutateAsync({
					id: review.id,
					review_session_id: sessionId
				})
			}
		},
		[review?.id, updateReviewMutation]
	)

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
				<DialogContent
					className='h-full w-full p-0 md:max-h-[600px] md:max-w-[700px] lg:max-w-[900px]'
					showCloseButton={false}
				>
					<SidebarProvider
						cookieName='sidebar:review-detail'
						defaultOpen={true}
						enableKeyboardShortcut={false}
					>
						<div className='flex h-full min-h-0 flex-col'>
							<div className='border-b px-2 py-1'>
								<Skeleton className='h-6 w-full' />
							</div>
							<SidebarHolder className='flex min-h-0 flex-1'>
								<div className='flex flex-col gap-4 px-6 pb-6'>
									<Skeleton className='h-10 w-full' />
									<Skeleton className='h-32 w-full' />
								</div>
								<Sidebar className='border-l' side='right'>
									<SidebarHeader className='flex flex-col gap-3 p-4'>
										<div className='flex min-h-8 items-center gap-2'>
											<Skeleton className='h-4 w-16' />
											<Skeleton className='h-8 flex-1' />
										</div>
										<div className='flex min-h-8 items-center gap-2'>
											<Skeleton className='h-4 w-16' />
											<Skeleton className='h-8 flex-1' />
										</div>
										<div className='flex min-h-8 items-center gap-2'>
											<Skeleton className='h-4 w-16' />
											<Skeleton className='h-8 flex-1' />
										</div>
										<div className='flex min-h-8 items-center gap-2'>
											<Skeleton className='h-4 w-16' />
											<Skeleton className='h-8 flex-1' />
										</div>
									</SidebarHeader>
								</Sidebar>
							</SidebarHolder>
						</div>
					</SidebarProvider>
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
				className='h-full w-full p-0 md:max-h-[600px] md:max-w-[700px] lg:max-w-[900px]'
				showCloseButton={false}
			>
				<SidebarProvider
					cookieName='sidebar:review-detail'
					defaultOpen={true}
					enableKeyboardShortcut={false}
				>
					<div className='flex h-full min-h-0 flex-col'>
						<div className='border-b'>
							<ReviewSessionDetailHeader
								headerAfterActions={headerActions}
								onDelete={handleDelete}
							/>
						</div>

						<SidebarHolder className='flex min-h-0 flex-1'>
							<div className='mt-4 flex h-full min-h-0 w-full min-w-0 gap-4 overflow-hidden px-4'>
								<ReviewRatingCheckbox
									className={`translate-y-0.5 ${isOverdueValue ? 'border-red-600 dark:border-red-700 dark:bg-red-700' : ''}`}
									disabled={isLoading || updateReviewMutation.isPending}
									onChange={handleStatusChange}
									value={reviewStatus}
								/>
								<div className='flex min-w-0 flex-1 flex-col'>
									<Textarea
										className='!bg-transparent m-0 resize-none overflow-hidden rounded-none border-none p-0 font-bold shadow-none [overflow-wrap:anywhere] focus:outline-none focus-visible:border-none focus-visible:ring-0'
										onChange={onDescriptionChange}
										placeholder='Description'
										spellCheck={false}
										value={description}
									/>
									<Textarea
										className='!bg-transparent m-0 resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
										onChange={onNotesChange}
										placeholder='Notes'
										spellCheck={false}
										value={notes}
									/>
								</div>
							</div>
							<Sidebar className='border-l' side='right'>
								<SidebarHeader className='flex flex-col gap-3 p-4'>
									{/* TODO: make the layout of these more durable, it's stinky rn */}
									{/* Date Picker - MOVED FROM MAIN CONTENT */}
									<div className='flex min-h-8 items-center gap-2'>
										<span className='w-16 flex-shrink-0 text-muted-foreground text-xs'>
											Date
										</span>
										<DatePickerDropdown
											isOpen={isDatePopoverOpen}
											onDateChange={handleDateChange}
											onOpenChange={setIsDatePopoverOpen}
											selectedDate={selectedDate}
											trigger={
												<Button
													className={cn(
														'min-w-0 flex-1 justify-start px-2',
														isOverdueValue && 'text-red-600 dark:text-red-400',
														relativeDate === 'Today' &&
															'text-blue-600 dark:text-blue-400'
													)}
													size='sm'
													variant='ghost'
												>
													<CalendarIcon className='h-4 w-4 flex-shrink-0' />
													<span className='truncate'>{relativeDate}</span>
												</Button>
											}
										/>
									</div>

									{/* Topic Link */}
									<div className='flex min-h-8 items-center gap-2'>
										<span className='w-16 flex-shrink-0 text-muted-foreground text-xs'>
											Topic
										</span>
										<Button
											className='min-w-0 flex-1 justify-start px-2'
											onClick={handleTopicClick}
											size='sm'
											variant='ghost'
										>
											<span className='truncate'>
												{review.topic?.name || 'Unknown'}
											</span>
										</Button>
									</div>

									{/* Session Picker */}
									<div className='flex min-h-8 items-center gap-2'>
										<span className='w-16 flex-shrink-0 text-muted-foreground text-xs'>
											Session
										</span>
										<SessionPickerPopover
											isOpen={isSessionPopoverOpen}
											onOpenChange={setIsSessionPopoverOpen}
											onSessionChange={handleSessionChange}
											selectedSessionId={review.review_session_id}
											trigger={
												<Button
													className='min-w-0 flex-1 justify-start px-2'
													size='sm'
													variant='ghost'
												>
													<SquareStack className='h-4 w-4 flex-shrink-0' />
													<span className='truncate'>
														{review.review_session
															? review.review_session.description?.trim() ||
																'No description'
															: 'No session'}
													</span>
												</Button>
											}
										/>
										{review.review_session && (
											<Button
												className='h-6 w-6 flex-shrink-0 p-0'
												onClick={handleSessionClick}
												size='sm'
												title='Go to session'
												variant='ghost'
											>
												<ExternalLink className='h-3 w-3' />
											</Button>
										)}
									</div>

									{/* Stability */}
									<div className='flex min-h-8 items-center gap-2'>
										<span className='w-16 flex-shrink-0 text-muted-foreground text-xs'>
											Stability
										</span>
										<div className='flex min-w-0 flex-1 items-center gap-2 px-2 text-sm'>
											<Anchor className='h-4 w-4 flex-shrink-0' />
											<span className='truncate'>
												{review.stability_after != null
													? `${Math.round(review.stability_after)}d`
													: 'Not calculated'}
											</span>
											{review.stability_after != null &&
												review.stability_before != null && (
													<span
														className={`${stabilityChangeColorClass} flex-shrink-0`}
													>
														(
														{review.stability_after >= review.stability_before
															? '+'
															: ''}
														{Math.round(
															review.stability_after - review.stability_before
														)}
														)
													</span>
												)}
										</div>
									</div>
								</SidebarHeader>
							</Sidebar>
						</SidebarHolder>
					</div>
				</SidebarProvider>
			</DialogContent>
		</Dialog>
	)
}

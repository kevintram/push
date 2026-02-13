import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { Anvil, CalendarIcon, Link, MoreHorizontal, X } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useCallback, useMemo, useState } from 'react'
import type { EntityItem } from '~/components/EntityCard'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { Textarea } from '~/components/ui/textarea'
import { SearchDialog } from '~/features/search/components/SearchDialog'
import { isOverdue } from '~/features/topics/utils/isOverdue'
import { useAutoSave } from '~/hooks/useAutoSave'
import { cn } from '~/lib/utils'
import { formatRelativeDate } from '~/utils/formatRelativeDate'
import { useDeleteReview } from '../api/deleteReview'
import { useReview } from '../api/getReviews'
import { useUpdateReview } from '../api/updateReview'
import type { UpdateReviewInput } from '../types/api.types'
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
	const [isSearchOpen, setIsSearchOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')

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

	const hasEntity = useMemo(
		() =>
			review?.topic_id != null ||
			review?.source_id != null ||
			review?.practice_id != null,
		[review?.topic_id, review?.source_id, review?.practice_id]
	)

	const stabilityChangeColorClass = useMemo(() => {
		if (review?.stability_after == null || review?.stability_before == null) {
			return ''
		}
		const roundedDelta = Math.round(
			review.stability_after - review.stability_before
		)
		if (roundedDelta >= 0) {
			return 'text-green-600 dark:text-green-400'
		}
		return 'text-red-600 dark:text-red-400'
	}, [review?.stability_after, review?.stability_before])
	const hasStability =
		review?.stability_after != null && review?.stability_before != null
	const stabilityAfterRounded = hasStability
		? Math.round(review.stability_after ?? 0)
		: 0
	const stabilityDeltaRounded = hasStability
		? Math.round((review.stability_after ?? 0) - (review.stability_before ?? 0))
		: 0

	// Helper to get the entity type label for display
	const getEntityTypeLabel = useCallback((): string => {
		if (review?.topic_id) return 'Topic'
		if (review?.source_id) return 'Source'
		if (review?.practice_id) return 'Practice'
		return ''
	}, [review?.topic_id, review?.source_id, review?.practice_id])

	// Helper to get the entity name for display
	const getEntityName = useCallback((): string => {
		if (review?.topic) return review.topic.name
		if (review?.source) return review.source.title
		if (review?.practice) return review.practice.prompt
		return 'Unknown'
	}, [review?.topic, review?.source, review?.practice])

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

	const handleEntityClick = useCallback(() => {
		if (!review?.id) return
		if (!hasEntity) {
			setIsSearchOpen(true)
			return
		}
		if (review?.topic_id) {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: review.topic_id.toString() }
			})
		} else if (review?.source_id) {
			navigate({
				to: '/sources/$sourceId',
				params: { sourceId: review.source_id.toString() }
			})
		} else if (review?.practice_id) {
			navigate({
				to: '/practices/$practiceId',
				params: { practiceId: review.practice_id.toString() }
			})
		}
	}, [
		hasEntity,
		navigate,
		review?.id,
		review?.topic_id,
		review?.source_id,
		review?.practice_id
	])

	const handleSearchOpenChange = useCallback((nextOpen: boolean) => {
		setIsSearchOpen(nextOpen)
		if (!nextOpen) {
			setSearchQuery('')
		}
	}, [])

	const handleDialogOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) {
				setIsSearchOpen(false)
				setSearchQuery('')
			}
			onOpenChange(nextOpen)
		},
		[onOpenChange]
	)

	const handleEntityRemove = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			event.stopPropagation()
			if (!review?.id) return
			const payload: UpdateReviewInput = { id: review.id }
			if (review.topic_id != null) {
				payload.topic_id = null
			} else if (review.source_id != null) {
				payload.source_id = null
			} else if (review.practice_id != null) {
				payload.practice_id = null
			}
			updateReviewMutation.mutate(payload)
		},
		[
			review?.id,
			review?.topic_id,
			review?.source_id,
			review?.practice_id,
			updateReviewMutation
		]
	)

	const handleEntitySelect = useCallback(
		(entity: EntityItem) => {
			if (!review?.id) return
			const payload: UpdateReviewInput = { id: review.id }
			if (entity.type === 'topic') {
				payload.topic_id = entity.item.id
			} else if (entity.type === 'source') {
				payload.source_id = entity.item.id
			} else {
				payload.practice_id = entity.item.id
			}
			updateReviewMutation.mutate(payload)
		},
		[review?.id, updateReviewMutation]
	)

	const headerActions = useMemo(
		() => (
			<Button
				className='h-6 w-6 p-0 text-muted-foreground'
				onClick={() => onOpenChange(false)}
				size='sm'
				variant='ghost'
			>
				<X className='h-4 w-4' />
			</Button>
		),
		[onOpenChange]
	)

	if (isLoading) {
		return (
			<Dialog onOpenChange={handleDialogOpenChange} open={open}>
				<DialogContent
					className='h-full w-full p-0 md:max-h-[400px] md:max-w-[540px] lg:max-w-[680px]'
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
		<>
			<Dialog onOpenChange={handleDialogOpenChange} open={open}>
				<DialogContent
					className='h-full w-full p-0 md:max-h-[400px] md:max-w-[540px] lg:max-w-[680px]'
					showCloseButton={false}
				>
					<div className='flex h-full min-h-0 flex-col'>
						<div className='flex items-center justify-between border-b px-2 py-1'>
							<div className='flex-1' />
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

						<div className='flex min-h-0 flex-1 flex-col gap-4 px-4 py-4'>
							<div className='grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-2'>
								<ReviewRatingCheckbox
									className={
										isOverdueValue
											? 'border-red-600 dark:border-red-700 dark:bg-red-700'
											: ''
									}
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
								<Textarea
									className='!bg-transparent col-span-2 col-start-2 m-0 min-h-0 min-w-0 resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
									onChange={onNotesChange}
									placeholder='Notes'
									spellCheck={false}
									value={notes}
								/>
							</div>

							<div className='mt-auto flex flex-wrap items-center gap-2'>
								<div className='inline-flex h-7 items-center rounded-md bg-secondary text-secondary-foreground'>
									<button
										className='flex items-center gap-1.5 px-2 text-sm'
										disabled={updateReviewMutation.isPending}
										onClick={handleEntityClick}
										title={hasEntity ? getEntityTypeLabel() : 'Entity'}
										type='button'
									>
										<Link className='h-3.5 w-3.5' />
										<span className={cn(!hasEntity && 'text-muted-foreground')}>
											{hasEntity ? getEntityName() : 'Entity'}
										</span>
									</button>
									{hasEntity && (
										<button
											aria-label='Remove entity'
											className='flex h-full items-center px-1.5 text-muted-foreground hover:text-foreground'
											disabled={updateReviewMutation.isPending}
											onClick={handleEntityRemove}
											type='button'
										>
											<X className='h-3 w-3' />
										</button>
									)}
								</div>
								{hasStability && (
									<Button className='h-7 px-2' size='sm' variant='secondary'>
										<Anvil className='h-3.5 w-3.5' />
										<span>Durability {stabilityAfterRounded}d</span>
										<span className={stabilityChangeColorClass}>
											({stabilityDeltaRounded >= 0 ? '+' : ''}
											{stabilityDeltaRounded})
										</span>
									</Button>
								)}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			<SearchDialog
				onOpenChange={handleSearchOpenChange}
				onSelectEntity={handleEntitySelect}
				open={isSearchOpen}
				query={searchQuery}
				setQuery={setSearchQuery}
			/>
		</>
	)
}

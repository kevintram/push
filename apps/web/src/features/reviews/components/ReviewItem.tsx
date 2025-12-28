import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import {
	BicepsFlexed,
	CalendarIcon,
	MoreHorizontal,
	SquareStack,
	StickyNote,
	Trash
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { isOverdue } from '~/features/topics/utils/isOverdue'
import { cn } from '~/lib/utils'
import { useDeleteReview } from '../api/deleteReview'
import { useUpdateReview } from '../api/updateReview'
import type { ReviewListItem } from '../types/review.types'
import { DatePickerDropdown } from './DatePickerDropdown'
import {
	ReviewRatingCheckbox,
	type ReviewRatingState
} from './ReviewRatingCheckbox'

const getRelativeDateLabel = (date: Date | null) => {
	if (!date) return null

	const today = dayjs().startOf('day')
	const dateDay = dayjs(date).startOf('day')
	const diffDays = dateDay.diff(today, 'day')

	if (diffDays === 0) return 'Today'
	if (diffDays === 1) return 'Tomorrow'
	if (diffDays === -1) return 'Yesterday'
	if (diffDays < 0) return `${Math.abs(diffDays)}d ago`
	return `in ${diffDays}d`
}

const getInitialSelectedDate = (entry: ReviewListItem) => {
	if (entry.completed_at) {
		return dayjs(entry.completed_at).toDate()
	}
	if (entry.scheduled_at) {
		return dayjs(entry.scheduled_at).toDate()
	}
	return null
}

const getStabilityChangeColorClass = (
	before: number | null,
	after: number | null
) => {
	if (after == null || before == null) {
		return ''
	}
	if (after > before) {
		return 'text-green-600 dark:text-green-400'
	}
	if (after < before) {
		return 'text-red-600 dark:text-red-400'
	}
	return 'text-muted-foreground'
}

interface ReviewItemProps {
	entry: ReviewListItem
	onReviewClick?: (reviewId: number) => void
	readonly?: boolean
	variant?: 'default' | 'session' | 'topic'
}

export function ReviewItem({
	entry,
	onReviewClick,
	readonly = false,
	variant = 'default'
}: ReviewItemProps) {
	const navigate = useNavigate()
	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date | null>(() =>
		getInitialSelectedDate(entry)
	)

	const updateReviewMutation = useUpdateReview()
	const deleteReviewMutation = useDeleteReview()

	const isCompleted = entry.completed_at != null
	const reviewStatus: ReviewRatingState = isCompleted
		? (entry.rating ?? 'good')
		: 'uncompleted'

	const stabilityChangeColorClass = getStabilityChangeColorClass(
		entry.stability_before,
		entry.stability_after
	)
	const hasStability =
		entry.stability_after != null && entry.stability_before != null
	const stabilityAfterRounded = hasStability
		? Math.round(entry.stability_after ?? 0)
		: 0
	const stabilityDeltaRounded = hasStability
		? Math.round((entry.stability_after ?? 0) - (entry.stability_before ?? 0))
		: 0

	const handleStatusChange = useCallback(
		(status: ReviewRatingState) => {
			if (!entry.id) return
			if (status === 'uncompleted') {
				updateReviewMutation.mutateAsync({
					id: entry.id,
					rating: null,
					completed_at: null
				})
				return
			}
			updateReviewMutation.mutateAsync({
				id: entry.id,
				rating: status,
				completed_at: dayjs().format('YYYY-MM-DD')
			})
		},
		[entry.id, updateReviewMutation]
	)

	const handleDateSave = useCallback(
		(newDate: Date | null) => {
			setSelectedDate(newDate)
			if (!entry.id) {
				setIsDatePopoverOpen(false)
				return
			}
			const newDateString = newDate ? dayjs(newDate).format('YYYY-MM-DD') : null
			if (entry.completed_at) {
				updateReviewMutation.mutateAsync({
					id: entry.id,
					completed_at: newDateString
				})
			} else {
				updateReviewMutation.mutateAsync({
					id: entry.id,
					scheduled_at: newDateString
				})
			}
			setIsDatePopoverOpen(false)
		},
		[entry.id, entry.completed_at, updateReviewMutation]
	)

	const handleDelete = useCallback(async () => {
		if (!entry.id) return
		await deleteReviewMutation.mutateAsync(entry.id)
	}, [deleteReviewMutation, entry.id])

	const handleReviewClick = useCallback(() => {
		if (readonly) return
		if (entry.id) {
			onReviewClick?.(entry.id)
		}
	}, [entry.id, onReviewClick, readonly])

	const handleSessionClick = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation()
			if (!entry.review_session) return
			navigate({
				to: '/review-session/$reviewSessionId',
				params: { reviewSessionId: entry.review_session.id.toString() }
			})
		},
		[navigate, entry.review_session]
	)

	const handleTopicClick = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation()
			navigate({
				to: '/topics/$topicId',
				params: { topicId: entry.topic.id.toString() }
			})
		},
		[navigate, entry.topic.id]
	)

	const effectiveDate = entry.effective_date
		? dayjs(entry.effective_date).toDate()
		: null

	const isOverdueValue = isOverdue({
		scheduled_at: entry.scheduled_at,
		isCompleted
	})

	const relativeDate = getRelativeDateLabel(effectiveDate)

	const sessionDisplayText = entry.review_session
		? entry.review_session.description?.trim() || 'no description'
		: 'No session'

	const dateButtonColorClass = cn(
		isOverdueValue && 'text-red-600 dark:text-red-400',
		!isOverdueValue &&
			relativeDate === 'Today' &&
			'text-blue-600 dark:text-blue-400'
	)
	const description = entry.description?.trim()

	// Determine if we're actually rendering topic or session content
	const showingTopic =
		(variant === 'default' || variant === 'topic') && entry.topic?.name
	const showingSession = variant === 'default' || variant === 'session'
	const showingTopicOrSession = showingTopic || showingSession

	return (
		<Card className='rounded-none border-0 border-b bg-transparent shadow-none'>
			<CardContent
				className={cn(
					'rounded-md py-2',
					readonly ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50'
				)}
				onClick={handleReviewClick}
			>
				<div className='flex flex-col'>
					{/* Row 1: Checkbox, Description, Date, More Button */}
					<div className='flex items-center pb-1'>
						<ReviewRatingCheckbox
							disabled={readonly || updateReviewMutation.isPending}
							invalid={isOverdueValue}
							onChange={handleStatusChange}
							value={reviewStatus}
						/>
						<span
							className={cn(
								'ml-2 min-w-0 flex-1 truncate text-sm',
								description ? 'text-foreground' : 'text-muted-foreground'
							)}
						>
							{description || 'No description'}
						</span>
						<Tooltip>
							<DatePickerDropdown
								disabled={readonly}
								isOpen={isDatePopoverOpen}
								onDateChange={handleDateSave}
								onOpenChange={setIsDatePopoverOpen}
								selectedDate={selectedDate}
								trigger={
									<TooltipTrigger asChild={true}>
										<Button
											className={cn(
												'text-xs',
												readonly
													? 'cursor-default opacity-50'
													: 'hover:bg-muted/50',
												dateButtonColorClass
											)}
											disabled={readonly}
											onClick={e => e.stopPropagation()}
											size='sm'
											variant='ghost'
										>
											<CalendarIcon className='h-3 w-3' />
											{relativeDate}
										</Button>
									</TooltipTrigger>
								}
							/>
							<TooltipContent>
								{effectiveDate && dayjs(effectiveDate).format('MMMM D, YYYY')}
							</TooltipContent>
						</Tooltip>
						{!readonly && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild={true}>
									<Button
										className='h-6 w-6 p-0'
										onClick={e => e.stopPropagation()}
										size='sm'
										title='More options'
										variant='ghost'
									>
										<MoreHorizontal className='h-3 w-3' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align='end'
									avoidCollisions={true}
									side='bottom'
									sideOffset={4}
								>
									<DropdownMenuItem
										onClick={e => {
											e.stopPropagation()
											handleDelete()
										}}
									>
										<Trash className='mr-2 h-4 w-4' />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
					<div className='flex items-center justify-end gap-2 text-muted-foreground text-xs'>
						{(variant === 'default' || variant === 'topic') && (
							<Button
								className='!px-0 h-auto text-muted-foreground text-xs hover:text-foreground'
								onClick={handleTopicClick}
								size='sm'
								variant='link'
							>
								<StickyNote className='h-3 w-3' />
								<span>{entry.topic.name}</span>
							</Button>
						)}
						{variant === 'default' && <span>⋅</span>}
						{(variant === 'default' || variant === 'session') && (
							<Button
								className='!px-0 h-auto text-muted-foreground text-xs hover:text-foreground'
								disabled={!entry.review_session}
								onClick={handleSessionClick}
								size='sm'
								variant='link'
							>
								<SquareStack className='h-3 w-3' />
								<span>{sessionDisplayText}</span>
							</Button>
						)}
						{hasStability && (
							<>
								{showingTopicOrSession && <span>⋅</span>}
								<div className='flex items-center'>
									<BicepsFlexed className='mr-1 h-3 w-3' />
									<span>{`${stabilityAfterRounded}d`}</span>
									<span className={cn('ml-1', stabilityChangeColorClass)}>
										({stabilityDeltaRounded >= 0 ? '+' : ''}
										{stabilityDeltaRounded})
									</span>
								</div>
							</>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

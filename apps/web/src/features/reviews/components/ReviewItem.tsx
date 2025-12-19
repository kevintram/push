import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import {
	BicepsFlexed,
	CalendarIcon,
	MoreHorizontal,
	SquareStack,
	Trash
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
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

interface ReviewItemProps {
	entry: ReviewListItem
	onReviewClick?: (reviewId: number) => void
	readonly?: boolean
}

export function ReviewItem({
	entry,
	onReviewClick,
	readonly = false
}: ReviewItemProps) {
	const navigate = useNavigate()
	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
	const [_isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
		if (entry.completed_at) {
			return entry.completed_at ? dayjs(entry.completed_at).toDate() : null
		}
		return entry.scheduled_at ? dayjs(entry.scheduled_at).toDate() : null
	})

	const updateReviewMutation = useUpdateReview()
	const deleteReviewMutation = useDeleteReview()

	const reviewStatus: ReviewRatingState = useMemo(() => {
		if (!entry.completed_at) return 'uncompleted'
		return entry.rating ?? 'good'
	}, [entry.completed_at, entry.rating])

	const stabilityChangeColorClass = useMemo(() => {
		if (entry.stability_after == null || entry.stability_before == null) {
			return ''
		}
		if (entry.stability_after > entry.stability_before) {
			return 'text-green-600 dark:text-green-400'
		}
		if (entry.stability_after < entry.stability_before) {
			return 'text-red-600 dark:text-red-400'
		}
		return 'text-muted-foreground'
	}, [entry.stability_after, entry.stability_before])

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
			if (entry.id) {
				const newDateString = newDate
					? dayjs(newDate).format('YYYY-MM-DD')
					: null
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
			}
			setIsDatePopoverOpen(false)
		},
		[entry.id, entry.completed_at, updateReviewMutation]
	)

	const handleDelete = useCallback(async () => {
		if (entry?.id) {
			await deleteReviewMutation.mutateAsync(entry.id)
		}
	}, [deleteReviewMutation, entry?.id])

	const handleReviewClick = useCallback(() => {
		if (readonly) return
		if (entry.id) {
			onReviewClick?.(entry.id)
		}
	}, [entry.id, onReviewClick, readonly])

	const handleSessionClick = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation()
			navigate({
				to: '/reviews/$reviewId',
				params: { reviewId: entry.review_session.id.toString() }
			})
		},
		[navigate, entry.review_session.id]
	)

	const effectiveDate: Date | null = useMemo(() => {
		if (entry.effective_date) {
			return dayjs(entry.effective_date).toDate()
		}
		return null
	}, [entry.effective_date])

	const isOverdueValue: boolean = useMemo(() => {
		return isOverdue({
			scheduled_at: entry.scheduled_at,
			isCompleted: entry.completed_at !== null
		})
	}, [entry.scheduled_at, entry.completed_at])

	const relativeDate = useMemo(() => {
		return getRelativeDateLabel(effectiveDate)
	}, [effectiveDate])

	const sessionDisplayText = useMemo(() => {
		const description = entry.review_session.description?.trim()
		return description || 'no description'
	}, [entry.review_session.description])

	const dateButtonColorClass = useMemo(() => {
		if (isOverdueValue) {
			return 'text-red-600 dark:text-red-400'
		}
		if (relativeDate === 'Today') {
			return 'text-blue-600 dark:text-blue-400'
		}
		return ''
	}, [isOverdueValue, relativeDate])

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
							className={
								isOverdueValue
									? 'border-red-600 dark:border-red-700 dark:bg-red-700'
									: ''
							}
							disabled={readonly || updateReviewMutation.isPending}
							onChange={handleStatusChange}
							value={reviewStatus}
						/>
						<span
							className={`ml-2 min-w-0 flex-1 truncate text-sm ${entry.description === '' || entry.description === null ? 'text-muted-foreground' : 'text-foreground'}`}
						>
							{entry.description || 'No description'}
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
											className={`text-xs ${readonly ? 'cursor-default opacity-50' : 'hover:bg-muted/50'} ${dateButtonColorClass}`}
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
							<DropdownMenu onOpenChange={setIsMoreDropdownOpen}>
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
						<Button
							className='!px-0 h-auto text-muted-foreground text-xs hover:text-foreground'
							onClick={handleSessionClick}
							size='sm'
							variant='link'
						>
							<SquareStack className='h-3 w-3' />
							<span>{sessionDisplayText}</span>
						</Button>
						{entry.stability_after != null &&
							entry.stability_before != null && (
								<>
									<span>⋅</span>
									<div className='flex items-center'>
										<BicepsFlexed className='mr-1 h-3 w-3' />
										<span>{`${Math.round(entry.stability_after)}d`}</span>
										<span className={`ml-1 ${stabilityChangeColorClass}`}>
											(
											{entry.stability_after >= entry.stability_before
												? '+'
												: ''}
											{Math.round(
												entry.stability_after - entry.stability_before
											)}
											)
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

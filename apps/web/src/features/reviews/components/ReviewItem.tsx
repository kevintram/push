import dayjs from 'dayjs'
import { CalendarIcon, MoreHorizontal, Trash } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import { Checkbox } from '~/components/ui/Checkbox'
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
import { useDeleteReview } from '../api/deleteReview'
import { useUpdateReview } from '../api/updateReview'
import type { Review } from '../types/review.types'
import { DatePickerDropdown } from './DatePickerDropdown'
import { ReviewTopicBadges } from './ReviewTopicBadges'

interface ReviewItemProps {
	entry: Review
	onReviewClick?: (reviewId: number) => void
	readonly?: boolean
}

export function ReviewItem({
	entry,
	onReviewClick,
	readonly = false
}: ReviewItemProps) {
	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
	const [_isDropdownOpen, setIsDropdownOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
		if (entry.completed_at) {
			return entry.completed_at ? dayjs(entry.completed_at).toDate() : null
		}
		return entry.scheduled_at ? dayjs(entry.scheduled_at).toDate() : null
	})

	const updateReviewMutation = useUpdateReview()
	const deleteReviewMutation = useDeleteReview()

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			if (entry.id) {
				updateReviewMutation.mutateAsync({
					id: entry.id,
					completed_at: checked ? dayjs().format('YYYY-MM-DD') : null
				})
			}
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
		if (!effectiveDate) return null

		const today = dayjs().startOf('day')
		const dateDay = dayjs(effectiveDate).startOf('day')
		const diffDays = dateDay.diff(today, 'day')

		if (diffDays === 0) return 'Today'
		if (diffDays === 1) return 'Tomorrow'
		if (diffDays === -1) return 'Yesterday'
		if (diffDays < 0) return `${Math.abs(diffDays)}d ago`
		return `in ${diffDays}d`
	}, [effectiveDate])

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
		<Card className='rounded-none border-0 border-b bg-transparent py-2 shadow-none'>
			<CardContent
				className={`rounded-md p-1 ${readonly ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50'}`}
				onClick={handleReviewClick}
			>
				<div className='flex flex-col'>
					{/* Row 1: Checkbox, Description, Date, More Button */}
					<div className='flex items-center pb-1'>
						<Checkbox
							checked={!!entry.completed_at}
							className={
								isOverdueValue
									? 'border-red-600 dark:border-red-700 dark:bg-red-700'
									: ''
							}
							disabled={readonly}
							onCheckedChange={handleCheckboxChange}
							onClick={e => e.stopPropagation()}
						/>
						<span
							className={`ml-2 min-w-0 flex-1 truncate text-sm ${entry.description === '' || entry.description === null ? 'text-muted-foreground' : 'text-foreground'}`}
						>
							{entry.description || 'Description'}
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
							<DropdownMenu onOpenChange={setIsDropdownOpen}>
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
					{/* Row 2: Topic Badges */}
					<ReviewTopicBadges review={entry} />
				</div>
			</CardContent>
		</Card>
	)
}

import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { CalendarIcon, MoreHorizontal, Trash } from 'lucide-react'
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
import { TopicBadge } from '~/features/topics/components/TopicBadge'
import { isOverdue } from '~/features/topics/utils/isOverdue'
import { cn } from '~/lib/utils'
import { formatRelativeDate } from '~/utils/formatRelativeDate'
import { useDeleteReviewSession } from '../api/deleteReviewSession'
import { reviewSessionKeys } from '../api/queryKeys'
import { useUpdateReviewSession } from '../api/updateReviewSession'
import type { ReviewSession } from '../types/review.types'
import { DatePickerDropdown } from './DatePickerDropdown'
import { SessionCheckbox } from './SessionCheckbox'

interface ReviewSessionItemProps {
	entry: ReviewSession
	onReviewClick?: (reviewId: number) => void
	readonly?: boolean
}

export function ReviewSessionItem({
	entry,
	onReviewClick,
	readonly = false
}: ReviewSessionItemProps) {
	const queryClient = useQueryClient()
	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
	const [_isDropdownOpen, setIsDropdownOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
		if (entry.completed_at) {
			return entry.completed_at ? dayjs(entry.completed_at).toDate() : null
		}
		return entry.scheduled_at ? dayjs(entry.scheduled_at).toDate() : null
	})

	const updateReviewMutation = useUpdateReviewSession()
	const deleteReviewMutation = useDeleteReviewSession()

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

	const handleMouseEnter = useCallback(() => {
		// Store review in query cache for prefetching
		if (entry.id) {
			queryClient.setQueryData(reviewSessionKeys.detail(entry.id), entry)
		}
	}, [queryClient, entry])

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

	const topicBadgesData = useMemo(() => {
		const items =
			entry.reviews
				?.filter(tr => tr.topic !== null)
				.map(tr => ({
					topic: tr.topic!,
					rating: tr.rating
				})) ?? []
		return {
			items,
			topicCount: items.length
		}
	}, [entry.reviews])

	const relativeDate = formatRelativeDate(effectiveDate)

	const dateButtonColorClass = useMemo(() => {
		if (isOverdueValue) {
			return 'text-red-600 dark:text-red-400'
		}
		if (relativeDate.text === 'Today') {
			return 'text-blue-600 dark:text-blue-400'
		}
		return ''
	}, [isOverdueValue, relativeDate.text])

	return (
		<Card className='rounded-none border-0 border-b bg-transparent shadow-none'>
			<CardContent
				className={cn(
					'rounded-md py-2',
					readonly ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50'
				)}
				onClick={handleReviewClick}
				onMouseEnter={handleMouseEnter}
			>
				<div className='flex flex-col'>
					{/* Row 1: Checkbox, Description, Date, More Button */}
					<div className='flex items-center pb-1'>
						<SessionCheckbox
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
											{relativeDate.text}
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
					<div className='flex flex-wrap items-center gap-2'>
						<span className='font-medium text-muted-foreground text-xs'>
							Topics
							{topicBadgesData.topicCount > 0 &&
								` (${topicBadgesData.topicCount})`}
						</span>
						{topicBadgesData.items.map(({ topic, rating }) => (
							<TopicBadge
								key={topic.id}
								name={topic.name}
								notes={topic.notes}
								rating={rating}
							/>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

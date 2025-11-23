import dayjs from 'dayjs'
import { CalendarIcon, MoreHorizontal, Trash } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
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
import type { Review } from '~/models/review-topic.types'
import { DatePickerDropdown } from '../DatePickerDropdown'

interface ReviewDetailHeaderProps {
	review: Review
	onDelete: () => void
	onDateChange: (newDate: Date | null) => void
	headerActions?: ReactNode
}

export function ReviewDetailHeader({
	review,
	onDelete,
	onDateChange,
	headerActions
}: ReviewDetailHeaderProps) {
	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)

	const selectedDate = review.completed_at
		? dayjs(review.completed_at).toDate()
		: review.scheduled_at
			? dayjs(review.scheduled_at).toDate()
			: null

	const effectiveDate = review.effective_date
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

	const isOverdueValue = useMemo(() => {
		return isOverdue({
			scheduled_at: review.scheduled_at,
			isCompleted: review.completed_at !== null
		})
	}, [review.scheduled_at, review.completed_at])

	const handleDateSave = (newDate: Date | null) => {
		onDateChange(newDate)
		setIsDatePopoverOpen(false)
	}

	return (
		<div className='flex items-center justify-between gap-4 px-2 py-1'>
			<div className='flex min-w-0 flex-1 items-center gap-4'>
				<Tooltip>
					<DatePickerDropdown
						isOpen={isDatePopoverOpen}
						onDateChange={handleDateSave}
						onOpenChange={setIsDatePopoverOpen}
						selectedDate={selectedDate}
						trigger={
							<TooltipTrigger asChild={true}>
								<Button
									className={
										isOverdueValue
											? 'text-red-600 dark:text-red-400'
											: relativeDate === 'Today'
												? 'text-blue-600 dark:text-blue-400'
												: ''
									}
									size='sm'
									variant='ghost'
								>
									<CalendarIcon className='mr-2 h-4 w-4' />
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

			<div className='flex items-center gap-2'>
				<DropdownMenu>
					<DropdownMenuTrigger asChild={true}>
						<Button
							className='h-6 w-6 p-0'
							size='sm'
							title='More options'
							variant='ghost'
						>
							<MoreHorizontal className='h-4 w-4' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem onClick={onDelete} variant='destructive'>
							<Trash className='mr-2 h-4 w-4' />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{headerActions}
			</div>
		</div>
	)
}

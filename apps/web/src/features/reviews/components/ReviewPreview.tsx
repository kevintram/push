import dayjs from 'dayjs'
import { CalendarIcon, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'
import { formatRelativeDate } from '~/utils/formatRelativeDate'
import { AddFirstReviewButton } from './AddFirstReviewButton'
import { DatePickerDropdown } from './DatePickerDropdown'
import {
	ReviewRatingCheckbox,
	type ReviewRatingState
} from './ReviewRatingCheckbox'

interface ReviewPreviewProps {
	show: boolean
	rating: ReviewRatingState
	description: string
	notes: string
	date: Date | null
	onShowChange: (show: boolean) => void
	onRatingChange: (rating: ReviewRatingState) => void
	onDescriptionChange: (description: string) => void
	onNotesChange: (notes: string) => void
	onDateChange: (date: Date | null) => void
}

export function ReviewPreview({
	show,
	rating,
	description,
	notes,
	date,
	onShowChange,
	onRatingChange,
	onDescriptionChange,
	onNotesChange,
	onDateChange
}: ReviewPreviewProps) {
	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)

	const handleDateSave = useCallback(
		(newDate: Date | null) => {
			onDateChange(newDate)
			setIsDatePopoverOpen(false)
		},
		[onDateChange]
	)

	const handleRemove = useCallback(() => {
		onShowChange(false)
		onRatingChange('uncompleted')
		onDescriptionChange('')
		onNotesChange('')
		onDateChange(null)
	}, [
		onShowChange,
		onRatingChange,
		onDescriptionChange,
		onNotesChange,
		onDateChange
	])

	const relativeDate = useMemo(() => formatRelativeDate(date), [date])

	const isOverdue = useMemo(
		() =>
			date !== null &&
			dayjs(date).startOf('day').isBefore(dayjs().startOf('day')),
		[date]
	)

	const dateButtonColorClass = cn(
		isOverdue && 'text-red-600 dark:text-red-400',
		!isOverdue &&
			relativeDate.text === 'Today' &&
			'text-blue-600 dark:text-blue-400'
	)

	if (!show) {
		return (
			<AddFirstReviewButton
				onSelectRating={newRating => {
					onShowChange(true)
					onRatingChange(newRating)
					onDateChange(newRating === 'uncompleted' ? null : new Date())
				}}
			/>
		)
	}

	return (
		<div className='relative rounded-lg border p-3'>
			<button
				aria-label='Remove review'
				className='absolute top-2 right-2 rounded-sm opacity-70 transition-opacity hover:opacity-100'
				onClick={handleRemove}
				type='button'
			>
				<X className='h-3.5 w-3.5' />
			</button>
			<div className='mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-2'>
				<ReviewRatingCheckbox onChange={onRatingChange} value={rating} />
				<Textarea
					className='!bg-transparent m-0 min-h-0 min-w-0 resize-none overflow-hidden rounded-none border-none p-0 font-semibold shadow-none [overflow-wrap:anywhere] focus:outline-none focus-visible:border-none focus-visible:ring-0'
					onChange={e => onDescriptionChange(e.target.value)}
					placeholder='Description'
					spellCheck={false}
					value={description}
				/>
				<DatePickerDropdown
					isOpen={isDatePopoverOpen}
					onDateChange={handleDateSave}
					onOpenChange={setIsDatePopoverOpen}
					selectedDate={date}
					trigger={
						<Button
							className={cn('shrink-0 text-xs', dateButtonColorClass)}
							size='sm'
							variant='ghost'
						>
							<CalendarIcon className='h-3 w-3' />
							{relativeDate.text}
						</Button>
					}
				/>
				<Textarea
					className='!bg-transparent col-span-2 col-start-2 m-0 min-h-0 resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
					onChange={e => onNotesChange(e.target.value)}
					placeholder='Notes'
					spellCheck={false}
					value={notes}
				/>
			</div>
		</div>
	)
}

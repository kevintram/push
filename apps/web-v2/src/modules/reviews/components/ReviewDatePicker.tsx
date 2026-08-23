import * as stylex from '@stylexjs/stylex'
import { CalendarIcon } from 'lucide-react'
import { DateTime } from 'luxon'
import { useState } from 'react'

import {
	Button,
	Calendar,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { useToday } from '~/hooks/useToday'
import { reviewDatePickerColors } from '~/styles/colors/components.stylex'
import { iconSizes, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'
import {
	formatAbsoluteDate,
	formatRelativeDate,
	getDateTone,
	parseDate,
} from '~/utils/date'

const styles = stylex.create({
	trigger: {
		blockSize: 'auto',

		paddingInline: spacing.xs,
	},
	today: { color: reviewDatePickerColors.triggerForegroundToday },
	overdue: { color: reviewDatePickerColors.triggerForegroundOverdue },
	content: {
		display: 'flex',
		flexDirection: 'column',
		rowGap: spacing.lg,
	},
})

interface ReviewDatePickerProps {
	disabled?: boolean
	isCompleted: boolean
	onChange?: (value: DateString | null) => void | Promise<void>
	value: DateString | null
}

export function ReviewDatePicker({
	disabled = false,
	isCompleted,
	onChange,
	value,
}: ReviewDatePickerProps) {
	const [isOpen, setIsOpen] = useState(false)
	const today = useToday()
	const relativeDate = formatRelativeDate(value, today)
	const dateTone = getDateTone(value, isCompleted, today)
	const dateToneStyle =
		dateTone === 'overdue'
			? styles.overdue
			: dateTone === 'today'
				? styles.today
				: null
	const absoluteDate = value === null ? null : formatAbsoluteDate(value)
	// react-day-picker uses native Date, so convert at this library boundary.
	const selectedDate =
		value === null ? undefined : parseDate(value).toJSDate()

	const selectDate = async (date: Date | undefined) => {
		if (!date) return
		if (onChange)
			await onChange(DateTime.fromJSDate(date).toISODate() as DateString)
		setIsOpen(false)
	}

	const clearDate = async () => {
		if (onChange) await onChange(null)
		setIsOpen(false)
	}

	const trigger = (
		<PopoverTrigger
			disabled={disabled}
			render={
				<Button
					aria-label={`Change review date, ${relativeDate}`}
					disabled={disabled}
					size='micro'
					variant='ghost'
					xstyle={[styles.trigger, dateToneStyle]}
				>
					<CalendarIcon aria-hidden='true' size={iconSizes.md} />
					{relativeDate}
				</Button>
			}
		/>
	)

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<Tooltip>
				<TooltipTrigger render={trigger} />
				<TooltipContent>
					{absoluteDate ?? 'Add due date'}
				</TooltipContent>
			</Tooltip>
			<PopoverContent align='center'>
				<div {...stylex.props(styles.content)}>
					<Calendar
						defaultMonth={selectedDate}
						disabled={
							isCompleted
								? { after: parseDate(today).toJSDate() }
								: undefined
						}
						mode='single'
						onSelect={date => void selectDate(date)}
						selected={selectedDate}
					/>
					<Button
						// A completed review must always have a date so disable date clearing.
						disabled={isCompleted}
						onClick={() => void clearDate()}
						size='small'
						variant='outline'
					>
						Clear
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	)
}

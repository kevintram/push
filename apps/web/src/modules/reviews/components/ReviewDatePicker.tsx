import * as stylex from '@stylexjs/stylex'
import { CalendarIcon } from 'lucide-react'
import { DateTime } from 'luxon'
import { useState } from 'react'

import {
	Button,
	type ButtonSize,
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
	getDueDateTone,
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

interface ReviewDatePickerCommonProps {
	disabled?: boolean
	size?: ButtonSize
}

type ReviewDatePickerProps = ReviewDatePickerCommonProps &
	(
		| {
				date: DateString | null
				emptyLabel?: string | null
				kind: 'scheduled'
				onDateChange: (date: DateString | null) => void
		  }
		| {
				date: DateString | null
				kind: 'completed'
				onDateChange: (date: DateString | null) => void
		  }
	)

export function ReviewDatePicker(props: ReviewDatePickerProps) {
	const { disabled = false, size = 'medium' } = props
	const [isOpen, setIsOpen] = useState(false)
	const today = useToday()
	const relativeDate = formatRelativeDate(props.date, today)
	const isCompleted = props.kind === 'completed'
	const dateTone = getDueDateTone(props.date, isCompleted, today)
	const dateToneStyle =
		dateTone === 'overdue'
			? styles.overdue
			: dateTone === 'today'
				? styles.today
				: null
	const absoluteDate =
		props.date === null ? null : formatAbsoluteDate(props.date)
	const triggerLabel =
		props.date === null && props.kind === 'scheduled'
			? props.emptyLabel === undefined
				? relativeDate
				: props.emptyLabel
			: props.date === null && props.kind === 'completed'
				? 'Add completion date'
				: relativeDate
	const accessibleTriggerLabel = triggerLabel ?? relativeDate
	// react-day-picker uses native Date, so convert at this library boundary.
	const selectedDate =
		props.date === null ? undefined : parseDate(props.date).toJSDate()

	const selectDate = (date: Date | undefined) => {
		if (!date) return
		props.onDateChange(DateTime.fromJSDate(date).toISODate() as DateString)
		setIsOpen(false)
	}

	const clearDate = () => {
		if (props.kind !== 'scheduled') return
		props.onDateChange(null)
		setIsOpen(false)
	}

	const trigger = (
		<PopoverTrigger
			disabled={disabled}
			render={
				<Button
					aria-label={`Change review date, ${accessibleTriggerLabel}`}
					disabled={disabled}
					size={size}
					variant='ghost'
					xstyle={[styles.trigger, dateToneStyle]}
				>
					<CalendarIcon aria-hidden='true' size={iconSizes.sm} />
					{triggerLabel}
				</Button>
			}
		/>
	)

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<Tooltip>
				<TooltipTrigger render={trigger} />
				<TooltipContent>
					{absoluteDate ??
						(props.kind === 'completed'
							? 'Add completion date'
							: 'Add due date')}
				</TooltipContent>
			</Tooltip>
			<PopoverContent align='center'>
				<div {...stylex.props(styles.content)}>
					<Calendar
						defaultMonth={
							selectedDate ?? parseDate(today).toJSDate()
						}
						disabled={
							isCompleted
								? { after: parseDate(today).toJSDate() }
								: undefined
						}
						mode='single'
						onSelect={selectDate}
						selected={selectedDate}
					/>
					{props.kind === 'scheduled' && (
						<Button
							onClick={clearDate}
							size='small'
							variant='outline'
						>
							Clear
						</Button>
					)}
				</div>
			</PopoverContent>
		</Popover>
	)
}

import * as stylex from '@stylexjs/stylex'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
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
import { colors } from '~/styles/colors.stylex'
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
	today: { color: colors.textInfo },
	overdue: { color: colors.textDanger },
	content: {
		display: 'flex',
		flexDirection: 'column',
		rowGap: spacing.lg,
	},
	popover: { backgroundColor: colors.bg },
})

interface ReviewDatePickerProps {
	disabled?: boolean
	isCompleted: boolean
	onChange: (value: DateString | null) => Promise<void>
	value: DateString | null
}

export function ReviewDatePicker({
	disabled = false,
	isCompleted,
	onChange,
	value,
}: ReviewDatePickerProps) {
	const [isOpen, setIsOpen] = useState(false)
	const relativeDate = formatRelativeDate(value)
	const dateTone = getDateTone(value, isCompleted)
	const dateToneStyle =
		dateTone === 'overdue'
			? styles.overdue
			: dateTone === 'today'
				? styles.today
				: null
	const absoluteDate = value === null ? null : formatAbsoluteDate(value)
	const selectedDate = value === null ? undefined : parseDate(value)

	const selectDate = async (date: Date | undefined) => {
		if (!date) return
		await onChange(format(date, 'yyyy-MM-dd') as DateString)
		setIsOpen(false)
	}

	const clearDate = async () => {
		await onChange(null)
		setIsOpen(false)
	}

	const trigger = (
		<PopoverTrigger
			disabled={disabled}
			render={
				<Button
					aria-label={`Change review date, ${relativeDate}`}
					disabled={disabled}
					onClick={event => event.stopPropagation()}
					onMouseDown={event => event.stopPropagation()}
					prefix={
						<CalendarIcon aria-hidden='true' size={iconSizes.sm} />
					}
					size='micro'
					variant='ghost'
					xstyle={[styles.trigger, dateToneStyle]}
				/>
			}
		>
			{relativeDate}
		</PopoverTrigger>
	)

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<Tooltip>
				<TooltipTrigger render={trigger} />
				<TooltipContent>
					{absoluteDate ?? 'Add due date'}
				</TooltipContent>
			</Tooltip>
			<PopoverContent
				align='center'
				onClick={event => event.stopPropagation()}
				onMouseDown={event => event.stopPropagation()}
				xstyle={styles.popover}
			>
				<div {...stylex.props(styles.content)}>
					<Calendar
						defaultMonth={selectedDate}
						mode='single'
						onSelect={date => void selectDate(date)}
						selected={selectedDate}
					/>
					<Button
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

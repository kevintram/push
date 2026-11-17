import * as stylex from '@stylexjs/stylex'
import type { AppHotkey } from '@tanstack/react-hotkeys'
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
import { ariaKeyShortcuts } from '~/modules/shortcuts/ariaKeyShortcuts'
import { ShortcutKeys } from '~/modules/shortcuts/components/ShortcutKeys'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { iconSizes } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'
import {
	formatAbsoluteDate,
	formatRelativeDate,
	getDueDateTone,
	parseDate,
} from '~/utils/date'

const styles = stylex.create({
	today: { color: colorsSemantic.textToday },
})

type ReviewDatePickerProps = {
	/** The review's completion day; `null` until a new review is rated. */
	date: DateString | null
	disabled?: boolean
	/** The shortcut that opens it, shown on the button and in its tooltip. */
	hotkey?: AppHotkey
	/** Controls whether the calendar is open; it manages itself when omitted. */
	open?: boolean
	onDateChange: (date: DateString) => void
	onOpenChange?: (open: boolean) => void
	size?: ButtonSize
}

/** Picks the day a review was completed, today or earlier. */
export function ReviewDatePicker({
	date,
	disabled = false,
	hotkey,
	open,
	onDateChange,
	onOpenChange,
	size = 'medium',
}: ReviewDatePickerProps) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
	const isOpen = open ?? uncontrolledOpen
	const setIsOpen = (next: boolean) => {
		setUncontrolledOpen(next)
		onOpenChange?.(next)
	}
	const today = useToday()
	// A completed review is never late, so only today stands out.
	const dateToneStyle =
		getDueDateTone(date, true, today) === 'today' ? styles.today : null
	const absoluteDate = date === null ? null : formatAbsoluteDate(date)
	const triggerLabel =
		date === null ? 'Add completion date' : formatRelativeDate(date, today)
	// react-day-picker uses native Date, so convert at this library boundary.
	const selectedDate = date === null ? undefined : parseDate(date).toJSDate()

	const selectDate = (selected: Date | undefined) => {
		if (!selected) return
		onDateChange(DateTime.fromJSDate(selected).toISODate() as DateString)
		setIsOpen(false)
	}

	const trigger = (
		<PopoverTrigger
			disabled={disabled}
			render={
				<Button
					aria-keyshortcuts={hotkey && ariaKeyShortcuts(hotkey)}
					aria-label={`Change review date, ${triggerLabel}`}
					disabled={disabled}
					size={size}
					shape='round'
					variant='secondary'
					xstyle={dateToneStyle}
				>
					<CalendarIcon aria-hidden='true' size={iconSizes.sm} />
					{triggerLabel}
					{hotkey && <ShortcutKeys aria-hidden hotkey={hotkey} />}
				</Button>
			}
		/>
	)

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<Tooltip>
				<TooltipTrigger render={trigger} />
				<TooltipContent>
					{absoluteDate ?? 'Add completion date'}
					{hotkey && <ShortcutKeys aria-hidden hotkey={hotkey} />}
				</TooltipContent>
			</Tooltip>
			<PopoverContent align='center'>
				<Calendar
					defaultMonth={selectedDate ?? parseDate(today).toJSDate()}
					disabled={{ after: parseDate(today).toJSDate() }}
					mode='single'
					onSelect={selectDate}
					selected={selectedDate}
				/>
			</PopoverContent>
		</Popover>
	)
}

import {
	differenceInCalendarDays,
	format,
	parseISO,
	startOfDay,
} from 'date-fns'

import type { DateString } from '~/types/date'

export type DateTone = 'default' | 'overdue' | 'today'

export function parseDate(value: DateString): Date {
	return parseISO(value)
}

export function formatAbsoluteDate(value: DateString): string {
	return format(parseDate(value), 'MMM d, yyyy')
}

export function formatRelativeDate(
	value: DateString | null,
	today = new Date(),
): string {
	if (value === null) return 'Unscheduled'

	const difference = differenceInCalendarDays(
		parseDate(value),
		startOfDay(today),
	)

	if (difference === 0) return 'Today'
	if (difference === 1) return 'Tomorrow'
	if (difference === -1) return 'Yesterday'
	if (difference < 0) return `${Math.abs(difference)}d ago`
	return `in ${difference}d`
}

export function getDateTone(
	value: DateString | null,
	isCompleted: boolean,
	today = new Date(),
): DateTone {
	if (value === null) return 'default'

	const difference = differenceInCalendarDays(
		parseDate(value),
		startOfDay(today),
	)

	if (!isCompleted && difference < 0) return 'overdue'
	if (difference === 0) return 'today'
	return 'default'
}

/**
 * Returns today's date as a `YYYY-MM-DD` string using the local calendar day.
 *
 * Uses local-time getters (not UTC) so the result matches the day the user sees
 * on their wall clock. Avoid `Date.prototype.toISOString()` here: it converts to
 * UTC first and can roll over to the next day near midnight.
 */
export function getTodayAsString(): DateString {
	const today = new Date()
	const year = today.getFullYear()
	const month = String(today.getMonth() + 1).padStart(2, '0')
	const day = String(today.getDate()).padStart(2, '0')

	return `${year}-${month}-${day}`
}

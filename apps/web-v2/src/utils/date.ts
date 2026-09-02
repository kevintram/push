import { DateTime } from 'luxon'

import type { DateString } from '~/types/date'

export type DueDateTone = 'default' | 'overdue' | 'today'

/** Return the current calendar day in the user's local timezone. */
export function todayIso(now: DateTime = DateTime.now()): DateString {
	const today = now.toISODate()
	if (today === null) throw new Error('Unable to determine the current date')
	return today as DateString
}

export function parseDate(value: DateString): DateTime {
	return DateTime.fromISO(value)
}

export function formatAbsoluteDate(value: DateString): string {
	return parseDate(value).toFormat('LLL d, yyyy')
}

export function formatRelativeDate(
	value: DateString | null,
	today: DateString = todayIso(),
): string {
	if (value === null) return 'Unscheduled'

	const difference = calendarDaysBetween(today, value)

	if (difference === 0) return 'Today'
	if (difference === 1) return 'Tomorrow'
	if (difference === -1) return 'Yesterday'
	if (difference < 0) return `${Math.abs(difference)}d ago`
	return `in ${difference}d`
}

/** Tone for a scheduled date: late unless the review is already done. */
export function getDueDateTone(
	value: DateString | null,
	isCompleted: boolean,
	today: DateString = todayIso(),
): DueDateTone {
	if (value === null) return 'default'

	const difference = calendarDaysBetween(today, value)

	if (!isCompleted && difference < 0) return 'overdue'
	if (difference === 0) return 'today'
	return 'default'
}

/**
 * Count signed local calendar days from `start` to `end`.
 *
 * Luxon's day diff is calendar-aware rather than a 24-hour division, so this
 * stays a whole number even across a DST transition between the two days.
 */
function calendarDaysBetween(start: DateString, end: DateString): number {
	return parseDate(end).diff(parseDate(start), 'days').days
}

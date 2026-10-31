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

/** Days on either side of today that read as relative, such as `7d ago`. */
const RELATIVE_DAYS = 7

/**
 * Describe a date relative to today within a week, such as `Yesterday` or
 * `in 3d`. Further dates show the month and day, plus the year when it
 * differs from today's.
 */
export function formatRelativeDate(
	value: DateString | null,
	today: DateString = todayIso(),
): string {
	if (value === null) return 'Unscheduled'

	const difference = calendarDaysBetween(today, value)

	if (difference === 0) return 'Today'
	if (difference === 1) return 'Tomorrow'
	if (difference === -1) return 'Yesterday'
	if (Math.abs(difference) <= RELATIVE_DAYS) {
		return difference < 0 ? `${-difference}d ago` : `in ${difference}d`
	}

	const date = parseDate(value)
	return date.hasSame(parseDate(today), 'year')
		? date.toFormat('LLL d')
		: formatAbsoluteDate(value)
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

import { DateTime } from 'luxon'

import type { DateString } from '~/types/date'

export type DateTone = 'default' | 'overdue' | 'today'

export function parseDate(value: DateString): DateTime {
	return DateTime.fromISO(value)
}

export function formatAbsoluteDate(value: DateString): string {
	return parseDate(value).toFormat('LLL d, yyyy')
}

export function formatRelativeDate(
	value: DateString | null,
	today: DateTime = DateTime.now(),
): string {
	if (value === null) return 'Unscheduled'

	const difference = parseDate(value)
		.startOf('day')
		.diff(today.startOf('day'), 'days').days

	if (difference === 0) return 'Today'
	if (difference === 1) return 'Tomorrow'
	if (difference === -1) return 'Yesterday'
	if (difference < 0) return `${Math.abs(difference)}d ago`
	return `in ${difference}d`
}

export function getDateTone(
	value: DateString | null,
	isCompleted: boolean,
	today: DateTime = DateTime.now(),
): DateTone {
	if (value === null) return 'default'

	const difference = parseDate(value)
		.startOf('day')
		.diff(today.startOf('day'), 'days').days

	if (!isCompleted && difference < 0) return 'overdue'
	if (difference === 0) return 'today'
	return 'default'
}

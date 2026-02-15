import dayjs from 'dayjs'

/**
 * Formats a date as an absolute date string (e.g., "Jan 5, 2025").
 */
export function formatAbsoluteDate(
	date: Date | string | null,
	fallback = 'never'
): string {
	if (!date) return fallback
	return dayjs(date).format('MMM D, YYYY')
}

interface FormatRelativeDateOptions {
	/**
	 * Whether to include future dates (Tomorrow, in 5d)
	 * When false, only past dates are formatted (for "last reviewed" style display)
	 * @default true
	 */
	includeFuture?: boolean
	/**
	 * Label to show when date is null
	 * @default 'No date'
	 */
	nullLabel?: string
	/**
	 * When true, past dates beyond yesterday display as "MMM D" (e.g., "Feb 3")
	 * instead of "Xd ago". Today and Yesterday remain unchanged.
	 * @default false
	 */
	shortDate?: boolean
}

interface FormatRelativeDateResult {
	/** Abbreviated text (e.g., "1d ago", "in 5d") */
	text: string
	/** Full text for tooltips (e.g., "1 day ago", "in 5 days") */
	tooltipText: string
}

/**
 * Formats a date as a relative date string (e.g., "Today", "1d ago", "in 5d")
 *
 * @param date - Date to format (can be Date object, ISO string, or null)
 * @param options - Formatting options
 * @returns Object with abbreviated `text` and full `tooltipText`
 *
 * @example
 * // For bidirectional dates (reviews)
 * formatRelativeDate(new Date()) // { text: 'Today', tooltipText: 'Today' }
 * formatRelativeDate(tomorrow) // { text: 'Tomorrow', tooltipText: 'Tomorrow' }
 * formatRelativeDate(fiveDaysAgo) // { text: '5d ago', tooltipText: '5 days ago' }
 *
 * @example
 * // For past-only dates (last reviewed)
 * formatRelativeDate(null, { includeFuture: false, nullLabel: 'never' })
 * // { text: 'never', tooltipText: 'never' }
 */
export function formatRelativeDate(
	date: Date | string | null,
	options: FormatRelativeDateOptions = {}
): FormatRelativeDateResult {
	const {
		includeFuture = true,
		nullLabel = 'No date',
		shortDate = false
	} = options

	if (!date) {
		return { text: nullLabel, tooltipText: nullLabel }
	}

	const today = dayjs().startOf('day')
	const dateDay = dayjs(date).startOf('day')
	const diffDays = dateDay.diff(today, 'day')

	if (diffDays === 0) {
		return { text: 'Today', tooltipText: 'Today' }
	}

	if (includeFuture && diffDays === 1) {
		return { text: 'Tomorrow', tooltipText: 'Tomorrow' }
	}

	if (diffDays === -1) {
		return { text: 'Yesterday', tooltipText: 'Yesterday' }
	}

	if (diffDays < 0) {
		if (shortDate) {
			const formatted = dayjs(date).format('MMM D')
			return { text: formatted, tooltipText: formatted }
		}
		const days = Math.abs(diffDays)
		return {
			text: `${days}d ago`,
			tooltipText: `${days} days ago`
		}
	}

	// Future dates (diffDays > 1)
	if (includeFuture) {
		return {
			text: `in ${diffDays}d`,
			tooltipText: `in ${diffDays} days`
		}
	}

	// Shouldn't happen for past-only mode, but handle gracefully
	return { text: nullLabel, tooltipText: nullLabel }
}

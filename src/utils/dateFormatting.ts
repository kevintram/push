/**
 * Utility functions for formatting dates for database operations
 */

/**
 * Converts a Date object to YYYY-MM-DD format for database date columns
 */
export function toDateString(date: Date): string {
	const isoString = date.toISOString()
	const datePart = isoString.split('T')[0]
	if (!datePart) throw new Error('Invalid date')
	return datePart
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
export function todayDateString(): string {
	return toDateString(new Date())
}

/**
 * Parses a date string (YYYY-MM-DD or ISO string) into a Date object
 * This replaces the previous dateOf function to handle date-only strings properly
 */
export function dateOf(dateStr: string | undefined | null): Date | undefined {
	if (!dateStr) return

	// If it's already a date-only string (YYYY-MM-DD), parse it as local date
	if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
		// Parse as local date to avoid timezone issues
		const parts = dateStr.split('-')
		const year = Number(parts[0])
		const month = Number(parts[1])
		const day = Number(parts[2])
		if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
			throw new Error(`Invalid date format: ${dateStr}`)
		}
		return new Date(year, month - 1, day)
	}

	// Otherwise parse as normal (handles ISO strings)
	return new Date(dateStr)
}

/**
 * Gets the current date as a Date object (no time component)
 */
export function todayDate(): Date {
	const today = new Date()
	return new Date(today.getFullYear(), today.getMonth(), today.getDate())
}

import type { DateString } from '~/types/date'

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

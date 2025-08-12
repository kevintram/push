/**
 * Calculates the number of days elapsed between two dates
 * @param from - The starting date
 * @param to - The ending date
 * @returns The number of days elapsed (positive for past dates, negative for future dates)
 * @throws Error if the provided dates are invalid
 */
export function numDaysElapsed(from: Date, to: Date): number {
	const oneDayInMs = 24 * 60 * 60 * 1000
	const diffInMs = to.getTime() - from.getTime()
	const daysElapsed = Math.floor(diffInMs / oneDayInMs)

	return Math.abs(daysElapsed)
}

/**
 * Calculates the number of days elapsed from a given date to today
 * @param fromDate - The starting date (Date object, string, or number timestamp)
 * @returns The number of days elapsed (positive for past dates, negative for future dates)
 * @throws Error if the provided date is invalid
 */
export function numDaysElapsedFrom(date: Date): number {
	const today = new Date()
	return numDaysElapsed(today, date)
}

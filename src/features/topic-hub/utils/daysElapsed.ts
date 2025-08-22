/**
 * Calculates the number of days elapsed between two dates
 * @param from - The starting date
 * @param to - The ending date
 * @returns The number of days elapsed (positive for past dates, negative for future dates)
 * @throws Error if the provided dates are invalid
 */
export function numDaysElapsed(
	from: Date | undefined,
	to: Date | undefined
): number {
	if (!(from && to)) {
		return 0
	}
	const diffInMs = Math.abs(to.getTime() - from.getTime())

	const oneDayInMs = 24 * 60 * 60 * 1000
	const daysElapsed = diffInMs / oneDayInMs

	return Math.floor(daysElapsed)
}

/**
 * Calculates the number of days elapsed from a given date to today
 * @param fromDate - The starting date (Date object, string, or number timestamp)
 * @returns The number of days elapsed (positive for past dates, negative for future dates)
 * @throws Error if the provided date is invalid
 */
export function numDaysElapsedFrom(date: Date | undefined): number {
	const today = new Date()
	return numDaysElapsed(today, date)
}

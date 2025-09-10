import dayjs from 'dayjs'

/**
 * Determines if a timeline entry is overdue based on its scheduled date and completion status
 * @param options - The options object
 * @param options.scheduledDate - The scheduled date string or Date object
 * @param options.isCompleted - Whether the entry is completed (optional, defaults to false)
 * @returns true if the entry is overdue, false otherwise
 */
export function isOverdue(options: {
	scheduledDate: string | Date | undefined | null
	isCompleted?: boolean
}): boolean {
	const { scheduledDate, isCompleted = false } = options

	// If completed, never consider it overdue
	if (isCompleted) return false

	// If no scheduled date, can't be overdue
	if (!scheduledDate) return false

	const today = dayjs().startOf('day')
	const scheduled = dayjs(scheduledDate).startOf('day')

	return scheduled.isBefore(today)
}

import dayjs from 'dayjs'

/**
 * Determines if a todo is overdue based on its scheduled date and completion status
 * @param options - The options object
 * @param options.scheduled_at - The scheduled date string or Date object
 * @param options.isCompleted - Whether the entry is completed (optional, defaults to false)
 * @returns true if the entry is overdue, false otherwise
 */
export function isOverdue(options: {
	scheduled_at: string | Date | undefined | null
	isCompleted?: boolean
}): boolean {
	const { scheduled_at, isCompleted = false } = options

	// If completed, never consider it overdue
	if (isCompleted) return false

	// If no scheduled date, can't be overdue
	if (!scheduled_at) return false

	const today = dayjs().startOf('day')
	const scheduled = dayjs(scheduled_at).startOf('day')

	return scheduled.isBefore(today)
}

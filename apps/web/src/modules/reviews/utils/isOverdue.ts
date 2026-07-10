import dayjs from 'dayjs'

export function isOverdue(options: {
	scheduledAt: string | Date | undefined | null
	isCompleted?: boolean
}): boolean {
	const { scheduledAt, isCompleted = false } = options

	if (isCompleted) return false
	if (!scheduledAt) return false

	const today = dayjs().startOf('day')
	const scheduled = dayjs(scheduledAt).startOf('day')

	return scheduled.isBefore(today)
}

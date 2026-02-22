import dayjs from 'dayjs'

export function isOverdue(options: {
	scheduled_at: string | Date | undefined | null
	isCompleted?: boolean
}): boolean {
	const { scheduled_at, isCompleted = false } = options

	if (isCompleted) return false
	if (!scheduled_at) return false

	const today = dayjs().startOf('day')
	const scheduled = dayjs(scheduled_at).startOf('day')

	return scheduled.isBefore(today)
}

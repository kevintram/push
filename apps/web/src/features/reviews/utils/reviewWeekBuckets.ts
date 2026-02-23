import type { WeekStartDay } from '~/stores/WeekStartContext'
import type { ReviewQueueItem } from '../types/review-queue.types'

const MS_PER_DAY = 24 * 60 * 60 * 1000

function startOfDay(date: Date): Date {
	const value = new Date(date)
	value.setHours(0, 0, 0, 0)
	return value
}

function addDays(date: Date, days: number): Date {
	const value = new Date(date)
	value.setDate(value.getDate() + days)
	return value
}

export function startOfWeek(date: Date, weekStartDay: WeekStartDay): Date {
	const day = startOfDay(date)
	const daysFromStart = (day.getDay() - weekStartDay + 7) % 7
	day.setDate(day.getDate() - daysFromStart)
	return day
}

function toDayNumber(date: Date): number {
	return Math.floor(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY
	)
}

export function getActionDays(entry: ReviewQueueItem): number | null {
	if (entry.queue_type === 'due') {
		return entry.days_until_due ?? null
	}
	if (entry.days_until_hazy === null || entry.days_until_hazy === undefined) {
		return null
	}
	return entry.days_until_hazy - 1
}

export function getWeekOffsetFromActionDays(
	actionDays: number,
	weekStartDay: WeekStartDay,
	today: Date = new Date()
): number {
	const currentWeekStart = startOfWeek(today, weekStartDay)
	const actionDate = addDays(startOfDay(today), actionDays)
	const actionWeekStart = startOfWeek(actionDate, weekStartDay)
	return (toDayNumber(actionWeekStart) - toDayNumber(currentWeekStart)) / 7
}

export function getThisWeekEndSubtext(
	weekStartDay: WeekStartDay,
	today: Date = new Date()
): string {
	const currentWeekStart = startOfWeek(today, weekStartDay)
	const weekEnd = addDays(currentWeekStart, 6)
	const daysUntilWeekEnd = toDayNumber(weekEnd) - toDayNumber(startOfDay(today))

	if (daysUntilWeekEnd <= 0) return 'Ends Today'
	if (daysUntilWeekEnd === 1) return 'Ends Tomorrow'
	return `Ends ${weekEnd.toLocaleDateString(undefined, { weekday: 'long' })}`
}

export function getWeekSectionLabel(offset: number): string {
	if (offset === 0) return 'This week'
	if (offset === 1) return 'Next week'
	return `In ${offset} weeks`
}

import type { ReviewCardQueueItem } from '~/features/review-cards/types/review-card.types'
import type { WeekStartDay } from '~/stores/WeekStartContext'

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

function parseAsOfDate(asOf: string): Date {
	const [year, month, day] = asOf.split('-').map(Number)
	if (!(year && month && day)) return new Date(asOf)
	return new Date(year, month - 1, day)
}

function startOfWeek(date: Date, weekStartDay: WeekStartDay): Date {
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

function getActionDays(item: ReviewCardQueueItem): number | null {
	if (item.queue_type === 'due') {
		return item.days_until_due
	}
	if (item.queue_type === 'hazy' && item.days_until_hazy != null) {
		return item.days_until_hazy - 1
	}
	return null
}

function getWeekOffsetFromActionDays(
	actionDays: number,
	weekStartDay: WeekStartDay,
	anchorDate: Date
): number {
	const currentWeekStart = startOfWeek(anchorDate, weekStartDay)
	const actionDate = addDays(startOfDay(anchorDate), actionDays)
	const actionWeekStart = startOfWeek(actionDate, weekStartDay)
	return (toDayNumber(actionWeekStart) - toDayNumber(currentWeekStart)) / 7
}

function getThisWeekEndSubtext(
	weekStartDay: WeekStartDay,
	anchorDate: Date
): string {
	const currentWeekStart = startOfWeek(anchorDate, weekStartDay)
	const weekEnd = addDays(currentWeekStart, 6)
	const daysUntilWeekEnd =
		toDayNumber(weekEnd) - toDayNumber(startOfDay(anchorDate))

	if (daysUntilWeekEnd <= 0) return 'Ends Today'
	if (daysUntilWeekEnd === 1) return 'Ends Tomorrow'
	return `Ends ${weekEnd.toLocaleDateString(undefined, { weekday: 'long' })}`
}

function getWeekSectionLabel(offset: number): string {
	if (offset === 0) return 'This week'
	if (offset === 1) return 'Next week'
	return `In ${offset} weeks`
}

function getQueueRank(item: ReviewCardQueueItem): number {
	if (item.queue_type === 'due') return 0
	if (item.queue_type === 'hazy') return 1
	return 2
}

function sortActionableQueueItems(
	a: ReviewCardQueueItem,
	b: ReviewCardQueueItem
): number {
	const aActionDays = getActionDays(a)
	const bActionDays = getActionDays(b)
	const aUrgency = aActionDays ?? Number.POSITIVE_INFINITY
	const bUrgency = bActionDays ?? Number.POSITIVE_INFINITY

	if (aUrgency !== bUrgency) {
		return aUrgency - bUrgency
	}
	const aRank = getQueueRank(a)
	const bRank = getQueueRank(b)
	if (aRank !== bRank) {
		return aRank - bRank
	}
	return (a.review_id ?? a.card.id) - (b.review_id ?? b.card.id)
}

type ActionableSection = {
	id: string
	items: Array<ReviewCardQueueItem>
	label: string
	subLabel?: string
	headingClassName?: string
}

export function groupReviewCardQueueByActionWeek(
	items: Array<ReviewCardQueueItem>,
	weekStartDay: WeekStartDay,
	asOf?: string
): Array<ActionableSection> {
	const overdueItems: Array<ReviewCardQueueItem> = []
	const weeklyBuckets = new Map<number, Array<ReviewCardQueueItem>>()
	const anchorDate = asOf ? parseAsOfDate(asOf) : new Date()

	for (const item of items) {
		const actionDays = getActionDays(item)
		if (actionDays == null) continue

		if (actionDays < 0) {
			overdueItems.push(item)
			continue
		}

		const weekOffset = getWeekOffsetFromActionDays(
			actionDays,
			weekStartDay,
			anchorDate
		)
		const bucket = weeklyBuckets.get(weekOffset)
		if (bucket) {
			bucket.push(item)
		} else {
			weeklyBuckets.set(weekOffset, [item])
		}
	}

	const output: Array<ActionableSection> = []
	if (overdueItems.length > 0) {
		output.push({
			id: 'overdue',
			label: 'Overdue',
			headingClassName: 'text-red-600 dark:text-red-400',
			items: [...overdueItems].sort(sortActionableQueueItems)
		})
	}

	for (const offset of [...weeklyBuckets.keys()].sort((a, b) => a - b)) {
		const bucketItems = weeklyBuckets.get(offset)
		if (!bucketItems || bucketItems.length === 0) continue

		output.push({
			id: `week-${offset}`,
			label: getWeekSectionLabel(offset),
			subLabel:
				offset === 0
					? getThisWeekEndSubtext(weekStartDay, anchorDate)
					: undefined,
			headingClassName:
				offset === 0 ? 'text-blue-600 dark:text-blue-400' : undefined,
			items: [...bucketItems].sort(sortActionableQueueItems)
		})
	}

	return output
}

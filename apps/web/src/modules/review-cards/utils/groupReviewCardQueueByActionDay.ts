import { type ReviewCardQueueItem } from '~/modules/review-cards/types/review-card.types'
import { type WeekStartDay } from '~/stores/WeekStartContext'

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

function getDateKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function toDayNumber(date: Date): number {
	return Math.floor(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
			MS_PER_DAY,
	)
}

function getWeekOffsetFromActionDays(
	actionDays: number,
	weekStartDay: WeekStartDay,
	anchorDate: Date,
): number {
	const currentWeekStart = startOfWeek(anchorDate, weekStartDay)
	const actionDate = addDays(startOfDay(anchorDate), actionDays)
	const actionWeekStart = startOfWeek(actionDate, weekStartDay)
	return (toDayNumber(actionWeekStart) - toDayNumber(currentWeekStart)) / 7
}

function getWeekSectionLabel(offset: number): string {
	if (offset === 1) return 'Next week'
	return `In ${offset} weeks`
}

function getNextWeekStartSubLabel(
	weekStartDay: WeekStartDay,
	anchorDate: Date,
): string {
	const currentWeekStart = startOfWeek(anchorDate, weekStartDay)
	const nextWeekStart = addDays(currentWeekStart, 7)
	const daysUntilNextWeek =
		toDayNumber(nextWeekStart) - toDayNumber(startOfDay(anchorDate))

	if (daysUntilNextWeek <= 0) return 'Starts Today'
	if (daysUntilNextWeek === 1) return 'Starts Tomorrow'
	return `Starts ${nextWeekStart.toLocaleDateString(undefined, { weekday: 'long' })}`
}

function getQueueRank(item: ReviewCardQueueItem): number {
	if (item.queue_type === 'due') return 0
	if (item.queue_type === 'hazy') return 1
	return 2
}

function sortActionableQueueItems(
	a: ReviewCardQueueItem,
	b: ReviewCardQueueItem,
): number {
	const aActionDays = a.action_days
	const bActionDays = b.action_days

	// Mirror the backend queue order so sectioned due views and focused mode
	// agree on which overdue scheduled reviews should be surfaced first.
	const aIsOverdueDue =
		a.queue_type === 'due' && aActionDays != null && aActionDays < 0
	const bIsOverdueDue =
		b.queue_type === 'due' && bActionDays != null && bActionDays < 0

	if (aIsOverdueDue !== bIsOverdueDue) {
		return aIsOverdueDue ? -1 : 1
	}
	if (aIsOverdueDue && bIsOverdueDue && aActionDays !== bActionDays) {
		return bActionDays! - aActionDays!
	}

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

function getSectionForActionDay(
	actionDays: number,
	weekStartDay: WeekStartDay,
	anchorDate: Date,
): Omit<ActionableSection, 'items'> {
	if (actionDays < 0) {
		return {
			id: 'overdue',
			label: 'Overdue',
			headingClassName: 'text-red-600 dark:text-red-400',
		}
	}

	if (actionDays === 0) {
		return {
			id: 'today',
			label: 'Today',
			headingClassName: 'text-blue-600 dark:text-blue-400',
		}
	}

	if (actionDays === 1) {
		return {
			id: 'tomorrow',
			label: 'Tomorrow',
		}
	}

	const actionDate = addDays(startOfDay(anchorDate), actionDays)
	const weekOffset = getWeekOffsetFromActionDays(
		actionDays,
		weekStartDay,
		anchorDate,
	)

	if (weekOffset === 0) {
		return {
			id: getDateKey(actionDate),
			label: actionDate.toLocaleDateString(undefined, {
				weekday: 'long',
			}),
		}
	}

	return {
		id: `week-${weekOffset}`,
		label: getWeekSectionLabel(weekOffset),
		subLabel:
			weekOffset === 1
				? getNextWeekStartSubLabel(weekStartDay, anchorDate)
				: undefined,
	}
}

export function groupReviewCardQueueByActionDay(
	items: Array<ReviewCardQueueItem>,
	weekStartDay: WeekStartDay,
	asOf?: string,
): Array<ActionableSection> {
	const sectionMap = new Map<string, ActionableSection>()
	const sectionOrder: Array<string> = []
	const anchorDate = asOf ? parseAsOfDate(asOf) : new Date()

	for (const item of items) {
		const actionDays = item.action_days
		if (actionDays == null) continue

		const section = getSectionForActionDay(
			actionDays,
			weekStartDay,
			anchorDate,
		)
		if (!sectionMap.has(section.id)) {
			sectionMap.set(section.id, {
				...section,
				items: [],
			})
			sectionOrder.push(section.id)
		}
		sectionMap.get(section.id)!.items.push(item)
	}

	return sectionOrder.map(sectionId => {
		const section = sectionMap.get(sectionId)
		if (!section) {
			throw new Error(`Missing queue section: ${sectionId}`)
		}
		return {
			...section,
			items: [...section.items].sort(sortActionableQueueItems),
		}
	})
}

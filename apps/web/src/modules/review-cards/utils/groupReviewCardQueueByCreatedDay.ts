import { type ReviewCardQueueItem } from '~/modules/review-cards/types/review-card.types'
import { type WeekStartDay } from '~/stores/WeekStartContext'

const MS_PER_DAY = 24 * 60 * 60 * 1000

type CreatedSection = {
	id: string
	items: Array<ReviewCardQueueItem>
	label: string
	headingClassName?: string
}

function startOfDay(date: Date): Date {
	const value = new Date(date)
	value.setHours(0, 0, 0, 0)
	return value
}

function parseAsOfDate(asOf: string): Date {
	const [year, month, day] = asOf.split('-').map(Number)
	if (!(year && month && day)) return new Date(asOf)
	return new Date(year, month - 1, day)
}

function parseItemDate(value: string | Date): Date {
	return value instanceof Date ? value : new Date(value)
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

function getWeeksAgo(
	itemDate: Date,
	weekStartDay: WeekStartDay,
	anchorDate: Date,
): number {
	const currentWeekStart = startOfWeek(anchorDate, weekStartDay)
	const itemWeekStart = startOfWeek(itemDate, weekStartDay)
	return (toDayNumber(currentWeekStart) - toDayNumber(itemWeekStart)) / 7
}

function getSectionForCreatedDate(
	itemDate: Date,
	weekStartDay: WeekStartDay,
	anchorDate: Date,
): Omit<CreatedSection, 'items'> {
	const daysAgo = Math.max(
		0,
		toDayNumber(startOfDay(anchorDate)) - toDayNumber(startOfDay(itemDate)),
	)

	if (daysAgo === 0) {
		return {
			id: 'today',
			label: 'Today',
			headingClassName: 'text-blue-600 dark:text-blue-400',
		}
	}

	if (daysAgo === 1) {
		return {
			id: 'yesterday',
			label: 'Yesterday',
		}
	}

	const weeksAgo = getWeeksAgo(itemDate, weekStartDay, anchorDate)
	if (weeksAgo === 0) {
		return {
			id: getDateKey(itemDate),
			label: itemDate.toLocaleDateString(undefined, { weekday: 'long' }),
		}
	}

	if (weeksAgo === 1) {
		return {
			id: 'last-week',
			label: 'Last week',
		}
	}

	return {
		id: `weeks-ago-${weeksAgo}`,
		label: `${weeksAgo} weeks ago`,
	}
}

export function groupReviewCardQueueByCreatedDay(
	items: Array<ReviewCardQueueItem>,
	weekStartDay: WeekStartDay,
	asOf?: string,
): Array<CreatedSection> {
	const sectionMap = new Map<string, CreatedSection>()
	const sectionOrder: Array<string> = []
	const anchorDate = asOf ? parseAsOfDate(asOf) : new Date()

	for (const item of items) {
		const createdAt = item.card.insertedAt
		if (!createdAt) continue

		const section = getSectionForCreatedDate(
			parseItemDate(createdAt),
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
			throw new Error(`Missing created-date section: ${sectionId}`)
		}
		return section
	})
}

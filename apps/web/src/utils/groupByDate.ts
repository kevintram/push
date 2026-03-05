import type { SearchResultItem } from '~/features/search/types/search.types'

export type DateSection<T> = {
	id: string
	label: string
	items: Array<T>
}

function getDateKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getDateLabel(date: Date, today: Date): string {
	const todayKey = getDateKey(today)
	const dateKey = getDateKey(date)

	if (dateKey === todayKey) return 'Today'

	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)
	if (dateKey === getDateKey(yesterday)) return 'Yesterday'

	const dateNormalized = new Date(date)
	dateNormalized.setHours(0, 0, 0, 0)
	const daysDiff = Math.floor(
		(today.getTime() - dateNormalized.getTime()) / (1000 * 60 * 60 * 24)
	)
	return `${daysDiff}d ago`
}

export function groupByDate<T>(
	entries: Array<{ item: T; date: string | Date }>
): Array<DateSection<T>> {
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	const groupMap = new Map<string, { label: string; items: Array<T> }>()
	const groupOrder: Array<string> = []

	for (const { item, date } of entries) {
		const dateObj = typeof date === 'string' ? new Date(date) : date
		const key = getDateKey(dateObj)

		if (!groupMap.has(key)) {
			groupMap.set(key, {
				label: getDateLabel(dateObj, today),
				items: []
			})
			groupOrder.push(key)
		}
		groupMap.get(key)!.items.push(item)
	}

	return groupOrder.map(key => ({
		id: key,
		label: groupMap.get(key)!.label,
		items: groupMap.get(key)!.items
	}))
}

export function toEntityEntries(
	results: Array<SearchResultItem>
): Array<{ item: SearchResultItem; date: string }> {
	return results.map(result => ({
		item: result,
		date: result.recent_activity_at
	}))
}

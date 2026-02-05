import type { EntityItem } from '~/components/EntityCard'
import type { SearchResultItem } from '~/features/search/types/search.types'

export type DateSection = {
	id: string
	label: string
	items: Array<EntityItem>
}

function getDateKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getDateLabel(date: Date, today: Date): string {
	// Today/Yesterday use date-key string comparison for reliable boundary detection.
	// Older dates use normalized-midnight arithmetic since off-by-one is less noticeable.
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

export function groupByDate(
	entries: Array<{ item: EntityItem; date: string | Date }>
): Array<DateSection> {
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	const groupMap = new Map<
		string,
		{ label: string; items: Array<EntityItem> }
	>()
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
): Array<{ item: EntityItem; date: string }> {
	return results.map(result => {
		let entity: EntityItem
		switch (result.entity_type) {
			case 'topic':
				entity = { type: 'topic', item: result.topic }
				break
			case 'source':
				entity = { type: 'source', item: result.source }
				break
			case 'practice':
				entity = { type: 'practice', item: result.practice }
				break
			default: {
				const _exhaustiveCheck: never = result
				return _exhaustiveCheck
			}
		}
		return { item: entity, date: result.recent_activity_at }
	})
}

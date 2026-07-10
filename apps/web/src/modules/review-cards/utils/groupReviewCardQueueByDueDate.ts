import dayjs from 'dayjs'

import { type ReviewCardQueueItem } from '~/modules/review-cards/types/review-card.types'

export function groupReviewCardQueueByDueDate(
	items: Array<ReviewCardQueueItem>,
) {
	const byDate = new Map<string, Array<ReviewCardQueueItem>>()

	for (const item of items) {
		const key = item.scheduledAt ?? 'unscheduled'
		if (!byDate.has(key)) byDate.set(key, [])
		byDate.get(key)?.push(item)
	}

	return [...byDate.entries()]
		.sort(([a], [b]) => {
			if (a === 'unscheduled') return 1
			if (b === 'unscheduled') return -1
			return a.localeCompare(b)
		})
		.map(([dateKey, groupedItems]) => ({
			id: dateKey,
			items: groupedItems,
			label:
				dateKey === 'unscheduled'
					? 'Unscheduled'
					: dayjs(dateKey).format('dddd, MMM D'),
		}))
}

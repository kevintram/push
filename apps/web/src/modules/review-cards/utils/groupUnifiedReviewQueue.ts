import { type ReviewCardQueueItem } from '~/modules/review-cards/types/review-card.types'
import { type WeekStartDay } from '~/stores/WeekStartContext'

import { groupReviewCardQueueByActionDay } from './groupReviewCardQueueByActionDay'

export type UnifiedReviewQueueSection = {
	id: string
	items: Array<ReviewCardQueueItem>
	label: string
	subLabel?: string
	headingClassName?: string
}

export function groupUnifiedReviewQueue(
	queues: {
		newItems: Array<ReviewCardQueueItem>
		dueItems: Array<ReviewCardQueueItem>
	},
	options: {
		asOf?: string
		weekStartDay: WeekStartDay
	},
): Array<UnifiedReviewQueueSection> {
	const sections: Array<UnifiedReviewQueueSection> = []

	if (queues.newItems.length > 0) {
		sections.push({
			id: 'new',
			items: queues.newItems,
			label: 'New',
		})
	}

	sections.push(
		...groupReviewCardQueueByActionDay(
			queues.dueItems,
			options.weekStartDay,
			options.asOf,
		),
	)

	return sections
}

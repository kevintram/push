import { useQuery } from '@tanstack/react-query'

import { useToday } from '~/hooks/useToday'

import { cardQueries } from '../api/cardQueries'
import { dueQueries } from '../api/dueQueries'
import type { ReviewQueueKey } from '../reviewQueues'

export type ReviewQueueCount = {
	count: number
	/** e.g. `2 cards due`; undefined when the queue is empty. */
	countLabel: string | undefined
}

function toQueueCount(
	count: number,
	singular: string,
	plural: string,
): ReviewQueueCount {
	return {
		count,
		countLabel:
			count > 0
				? `${count} ${count === 1 ? singular : plural}`
				: undefined,
	}
}

/** Card counts and accessible labels for the sidebar review queue links. */
export function useReviewQueueCounts() {
	const today = useToday()
	// TODO(3): Replace these full-list subscriptions with count queries.
	// TODO(2): Handle query errors instead of showing failed queues as empty.
	const { data: dueEntries } = useQuery(dueQueries.listDue(today))
	const { data: newEntries } = useQuery(dueQueries.listNew())
	const { data: lateCards } = useQuery(dueQueries.listLateCards(today))
	const { data: flaggedCards } = useQuery(cardQueries.listFlagged())

	return {
		due: toQueueCount(dueEntries?.length ?? 0, 'card due', 'cards due'),
		new: toQueueCount(newEntries?.length ?? 0, 'new card', 'new cards'),
		late: toQueueCount(lateCards?.length ?? 0, 'late card', 'late cards'),
		flagged: toQueueCount(
			flaggedCards?.length ?? 0,
			'flagged card',
			'flagged cards',
		),
	} satisfies Record<ReviewQueueKey, ReviewQueueCount>
}

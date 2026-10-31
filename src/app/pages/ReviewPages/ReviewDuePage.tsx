import { useSuspenseQuery } from '@tanstack/react-query'

import { useToday } from '~/hooks/useToday'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { ReviewQueueWorkspace } from '~/modules/reviews/components/review-queue/ReviewQueueWorkspace'

export function ReviewDuePage() {
	const today = useToday()
	const { data: entries } = useSuspenseQuery(dueQueries.listDue(today))

	return (
		<ReviewQueueWorkspace
			cards={entries.map(entry => entry.card)}
			title='Due'
			today={today}
		/>
	)
}

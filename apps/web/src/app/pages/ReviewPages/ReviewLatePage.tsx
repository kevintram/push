import { useSuspenseQuery } from '@tanstack/react-query'

import { useToday } from '~/hooks/useToday'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { ReviewQueueWorkspace } from '~/modules/reviews/components/review-queue/ReviewQueueWorkspace'
import { reviewQueues } from '~/modules/reviews/reviewQueues'

export function ReviewLatePage() {
	const today = useToday()
	const { data: cards } = useSuspenseQuery(dueQueries.listLateCards(today))

	return (
		<ReviewQueueWorkspace
			cards={cards}
			title={reviewQueues.late.label}
			today={today}
		/>
	)
}

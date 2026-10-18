import { useSuspenseQuery } from '@tanstack/react-query'

import { useToday } from '~/hooks/useToday'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { ReviewQueueWorkspace } from '~/modules/reviews/components/review-queue/ReviewQueueWorkspace'
import { reviewQueues } from '~/modules/reviews/reviewQueues'

export function ReviewFlaggedPage() {
	const today = useToday()
	const { data: cards } = useSuspenseQuery(cardQueries.listFlagged())

	return (
		<ReviewQueueWorkspace
			cards={cards}
			title={reviewQueues.flagged.label}
			today={today}
		/>
	)
}

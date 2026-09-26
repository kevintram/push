import { useSuspenseQuery } from '@tanstack/react-query'

import { useToday } from '~/hooks/useToday'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { ReviewQueueWorkspace } from '~/modules/reviews/components/review-queue/ReviewQueueWorkspace'

export function ReviewFlaggedPage() {
	const today = useToday()
	const { data: cards } = useSuspenseQuery(cardQueries.listFlagged())

	return <ReviewQueueWorkspace cards={cards} title='Flagged' today={today} />
}

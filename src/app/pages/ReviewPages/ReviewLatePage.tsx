import { useSuspenseQuery } from '@tanstack/react-query'

import { useToday } from '~/hooks/useToday'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { ReviewQueueWorkspace } from '~/modules/reviews/components/review-queue/ReviewQueueWorkspace'

export function ReviewLatePage() {
	const today = useToday()
	const { data: cards } = useSuspenseQuery(dueQueries.listLateCards(today))

	return <ReviewQueueWorkspace cards={cards} title='Late' today={today} />
}

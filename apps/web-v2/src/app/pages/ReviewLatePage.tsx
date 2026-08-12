import { useSuspenseQuery } from '@tanstack/react-query'

import { useToday } from '~/hooks/useToday'
import { dueQueries } from '~/modules/reviews/api/dueQueries'

import { ReviewListPage } from './ReviewListPage'

export function ReviewLatePage() {
	const today = useToday()
	const { data: entries } = useSuspenseQuery(
		dueQueries.listByDueDate({ to: today }),
	)

	const reviewCards = [
		// dedupe by card._id
		...new Map(entries.map(entry => [entry.card._id, entry.card])).values(),
	]

	return (
		<ReviewListPage reviewCards={reviewCards} title='Late' today={today} />
	)
}

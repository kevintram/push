import { useSuspenseQuery } from '@tanstack/react-query'

import { useToday } from '~/hooks/useToday'
import { dueQueries } from '~/modules/reviews/api/dueQueries'

import { ReviewListPage } from './ReviewListPage'

export function ReviewDuePage() {
	const today = useToday()
	const { data: entries } = useSuspenseQuery(dueQueries.list(today))

	return (
		<ReviewListPage
			reviewCards={entries.map(entry => entry.card)}
			title='Due'
			today={today}
		/>
	)
}

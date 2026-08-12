import { useSuspenseQuery } from '@tanstack/react-query'

import { useToday } from '~/hooks/useToday'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'

import { ReviewListPage } from './ReviewListPage'

export function ReviewNewPage() {
	const today = useToday()
	const { data: reviewCards } = useSuspenseQuery(reviewCardQueries.listNew())

	return (
		<ReviewListPage reviewCards={reviewCards} title='New' today={today} />
	)
}

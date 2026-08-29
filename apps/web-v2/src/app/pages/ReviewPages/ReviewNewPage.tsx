import { useSuspenseQuery } from '@tanstack/react-query'

import { useToday } from '~/hooks/useToday'
import { cardQueries } from '~/modules/reviews/api/cardQueries'

import { ReviewListPage } from './ReviewListPage'

export function ReviewNewPage() {
	const today = useToday()
	const { data: cards } = useSuspenseQuery(cardQueries.listNew())

	return <ReviewListPage cards={cards} title='New' today={today} />
}

import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'

import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'
import { ReviewCardOverview } from '~/modules/reviews/components/ReviewCardOverview'

export function ReviewCardPageOverview() {
	const { reviewCardId } = useParams({ from: '/review-cards/$reviewCardId' })
	const { data: reviewCard } = useSuspenseQuery(
		reviewCardQueries.detail(reviewCardId),
	)

	// The parent layout stops rendering the outlet in this case, so this is
	// belt-and-braces for the render that may still be in flight.
	if (!reviewCard) return null

	return <ReviewCardOverview reviewCard={reviewCard} />
}

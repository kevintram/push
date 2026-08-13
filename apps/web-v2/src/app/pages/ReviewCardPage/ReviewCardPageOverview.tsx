import { useParams } from '@tanstack/react-router'

import { ReviewCardOverview } from '~/modules/reviews/components/ReviewCardOverview'

export function ReviewCardPageOverview() {
	const { reviewCardId } = useParams({ from: '/review-cards/$reviewCardId' })

	return <ReviewCardOverview reviewCardId={reviewCardId} />
}

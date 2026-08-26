import { Link, useMatchRoute, useParams } from '@tanstack/react-router'

import {
	ReviewCardDetail,
	type ReviewCardTab,
} from '~/modules/reviews/components/review-card-detail/ReviewCardDetail'

/**
 * Wrapper for dealing with ReviewCardDetail navigation/routing because
 * ReviewCardDetail manages its tab navigation. This wrapper passes tanstack
 * navigation params to ReviewCardDetail so direct URL navigation to a tab
 * in ReviewCardDetail can work.
 */
export function ReviewCardPage() {
	const { reviewCardId } = useParams({
		from: '/review-cards/$reviewCardId',
	})
	const matchRoute = useMatchRoute()
	const activeTab: ReviewCardTab = matchRoute({
		to: '/review-cards/$reviewCardId/reviews',
		params: { reviewCardId },
	})
		? 'reviews'
		: 'overview'

	return (
		<ReviewCardDetail
			reviewCardId={reviewCardId}
			activeTab={activeTab}
			tabLinks={{
				overview: (
					<Link
						to='/review-cards/$reviewCardId'
						params={{ reviewCardId }}
					/>
				),
				reviews: (
					<Link
						to='/review-cards/$reviewCardId/reviews'
						params={{ reviewCardId }}
					/>
				),
			}}
		/>
	)
}

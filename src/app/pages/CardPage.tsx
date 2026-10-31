import { Link, useMatchRoute, useParams } from '@tanstack/react-router'

import {
	CardDetail,
	type CardTab,
} from '~/modules/reviews/components/card-detail/CardDetail'

/**
 * Wrapper for dealing with CardDetail navigation/routing because
 * CardDetail manages its tab navigation. This wrapper passes tanstack
 * navigation params to CardDetail so direct URL navigation to a tab
 * in CardDetail can work.
 */
export function CardPage() {
	const { cardId } = useParams({
		from: '/cards/$cardId',
	})
	const matchRoute = useMatchRoute()
	const activeTab: CardTab = matchRoute({
		to: '/cards/$cardId/reviews',
		params: { cardId },
	})
		? 'reviews'
		: 'overview'

	return (
		<CardDetail
			cardId={cardId}
			activeTab={activeTab}
			tabLinks={{
				overview: <Link to='/cards/$cardId' params={{ cardId }} />,
				reviews: (
					<Link to='/cards/$cardId/reviews' params={{ cardId }} />
				),
			}}
		/>
	)
}

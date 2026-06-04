import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ReviewCardDetailPage } from '~/app/pages/review-card-detail/ReviewCardDetailPage'
import {
	isReviewCardDetailTab,
	type ReviewCardDetailTab
} from '~/app/pages/review-card-detail/shared'

type ReviewCardDetailRouteSearch = {
	tab: ReviewCardDetailTab
}

export const Route = createFileRoute('/review-cards_/$reviewCardId')({
	validateSearch: (search): ReviewCardDetailRouteSearch => {
		const { tab } = search

		return {
			tab: typeof tab === 'string' && isReviewCardDetailTab(tab) ? tab : 'home'
		}
	},
	component: RouteComponent
})

function RouteComponent() {
	const navigate = useNavigate()
	const { reviewCardId } = Route.useParams()
	const search = Route.useSearch()

	return (
		<ReviewCardDetailPage
			activeTab={search.tab}
			onActiveTabChange={tab =>
				navigate({
					to: '/review-cards/$reviewCardId',
					params: { reviewCardId },
					search: { tab }
				})
			}
			reviewCardId={Number(reviewCardId)}
		/>
	)
}

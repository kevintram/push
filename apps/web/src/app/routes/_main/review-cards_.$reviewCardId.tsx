import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
	ReviewCardDetailPage,
	type ReviewCardDetailTab
} from '~/app/pages/ReviewCardDetailPage'

type ReviewCardDetailRouteSearch = {
	tab: ReviewCardDetailTab
}

function isReviewCardDetailTab(value: unknown): value is ReviewCardDetailTab {
	return value === 'home' || value === 'notes' || value === 'reviews'
}

export function validateReviewCardDetailSearch(
	search: Record<string, unknown>
): ReviewCardDetailRouteSearch {
	return {
		tab: isReviewCardDetailTab(search.tab) ? search.tab : 'home'
	}
}

export const Route = createFileRoute('/_main/review-cards_/$reviewCardId')({
	validateSearch: validateReviewCardDetailSearch,
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

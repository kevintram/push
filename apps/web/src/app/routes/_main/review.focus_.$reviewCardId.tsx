import { createFileRoute } from '@tanstack/react-router'
import { ReviewFocusPage } from '~/app/pages/ReviewFocusPage'
import {
	resolveReviewFilter,
	resolveReviewFocusOrder,
	validateReviewFocusSearch
} from '~/app/routes/_main/review'

export const Route = createFileRoute('/_main/review/focus_/$reviewCardId')({
	validateSearch: validateReviewFocusSearch,
	component: ReviewFocusCardRoute
})

function ReviewFocusCardRoute() {
	const { reviewCardId } = Route.useParams()
	const search = Route.useSearch()
	const filter = resolveReviewFilter(search)
	const order = resolveReviewFocusOrder(search)

	return (
		<ReviewFocusPage
			filter={filter}
			order={order}
			reviewCardId={Number(reviewCardId)}
			shuffle={search.shuffle}
		/>
	)
}

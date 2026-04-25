import { createFileRoute } from '@tanstack/react-router'
import { ReviewFocusPage } from '~/app/pages/ReviewFocusPage'
import {
	resolveReviewFilter,
	resolveReviewFocusOrder,
	validateReviewFocusSearch
} from '~/app/routes/_main/review'

export const Route = createFileRoute('/_main/review/focus')({
	validateSearch: validateReviewFocusSearch,
	component: ReviewFocusRoute
})

function ReviewFocusRoute() {
	const search = Route.useSearch()
	const filter = resolveReviewFilter(search)
	const order = resolveReviewFocusOrder(search)

	return (
		<ReviewFocusPage filter={filter} order={order} shuffle={search.shuffle} />
	)
}

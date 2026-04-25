import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ReviewPage } from '~/app/pages/ReviewPage'
import {
	getStoredReviewViewPreference,
	isReviewFilter,
	isReviewFocusOrder,
	persistReviewViewPreference
} from '~/features/review-cards/reviewQueueViewPreferences'
import type {
	ReviewFilter,
	ReviewFocusOrder
} from '~/features/review-cards/types/review-card.types'

type ReviewRouteSearch = {
	filter?: ReviewFilter
}

type ReviewFocusRouteSearch = ReviewRouteSearch & {
	order?: ReviewFocusOrder
	shuffle?: string
}

export function validateReviewSearch(
	search: Record<string, unknown>
): ReviewRouteSearch {
	return {
		filter: isReviewFilter(search.filter) ? search.filter : undefined
	}
}

export function validateReviewFocusSearch(
	search: Record<string, unknown>
): ReviewFocusRouteSearch {
	const result: ReviewFocusRouteSearch = validateReviewSearch(search)

	if (isReviewFocusOrder(search.order)) {
		result.order = search.order
	}

	if (typeof search.shuffle === 'string' && search.shuffle.trim().length > 0) {
		result.shuffle = search.shuffle
	}

	return result
}

export function resolveReviewFilter(search: ReviewRouteSearch): ReviewFilter {
	return search.filter ?? getStoredReviewViewPreference().filter
}

export function resolveReviewFocusOrder(
	search: ReviewFocusRouteSearch
): ReviewFocusOrder {
	return search.order ?? getStoredReviewViewPreference().focusOrder
}

export const Route = createFileRoute('/_main/review')({
	validateSearch: validateReviewSearch,
	component: ReviewRoute
})

function ReviewRoute() {
	const navigate = useNavigate()
	const search = Route.useSearch()
	const filter = resolveReviewFilter(search)

	useEffect(() => {
		persistReviewViewPreference({
			...getStoredReviewViewPreference(),
			filter
		})
	}, [filter])

	return (
		<ReviewPage
			filter={filter}
			onFilterChange={nextFilter =>
				navigate({
					to: '/review',
					search: { filter: nextFilter }
				})
			}
		/>
	)
}

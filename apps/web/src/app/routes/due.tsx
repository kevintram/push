import {
	createFileRoute,
	Outlet,
	useNavigate,
	useRouterState,
} from '@tanstack/react-router'
import { useEffect } from 'react'

import { DuePage } from '~/app/pages/DuePage'
import {
	getStoredDueViewPreference,
	isReviewFilter,
	isReviewFocusOrder,
	persistDueViewPreference,
} from '~/modules/review-cards/dueQueueViewPreferences'
import {
	type ReviewFilter,
	type ReviewFocusOrder,
} from '~/modules/review-cards/types/review-card.types'

type DueRouteSearch = {
	filter?: ReviewFilter
}

type DueFocusRouteSearch = DueRouteSearch & {
	card?: number
	done?: boolean
	include_future?: boolean
	order?: ReviewFocusOrder
	shuffle?: string
}

export function validateDueSearch(
	search: Record<string, unknown>,
): DueRouteSearch {
	return {
		filter: isReviewFilter(search.filter) ? search.filter : undefined,
	}
}

export function validateDueFocusSearch(
	search: Record<string, unknown>,
): DueFocusRouteSearch {
	const result: DueFocusRouteSearch = validateDueSearch(search)
	const card =
		typeof search.card === 'number'
			? search.card
			: typeof search.card === 'string'
				? Number(search.card)
				: Number.NaN

	if (Number.isInteger(card) && card > 0) {
		result.card = card
	}

	if (search.done === true || search.done === 'true') {
		result.done = true
	}

	if (search.include_future === true || search.include_future === 'true') {
		result.include_future = true
	}

	if (isReviewFocusOrder(search.order)) {
		result.order = search.order
	}

	if (
		typeof search.shuffle === 'string' &&
		search.shuffle.trim().length > 0
	) {
		result.shuffle = search.shuffle
	}

	return result
}

export function resolveDueFilter(search: DueRouteSearch): ReviewFilter {
	return search.filter ?? getStoredDueViewPreference().filter
}

export function resolveDueFocusOrder(
	search: DueFocusRouteSearch,
): ReviewFocusOrder {
	return search.order ?? getStoredDueViewPreference().focusOrder
}

export const Route = createFileRoute('/due')({
	validateSearch: validateDueSearch,
	component: DueRoute,
})

function DueRoute() {
	const navigate = useNavigate()
	const search = Route.useSearch()
	const pathname = useRouterState({
		select: state => state.location.pathname,
	})
	const filter = resolveDueFilter(search)
	const isFocusRoute = pathname.startsWith('/due/focus')

	useEffect(() => {
		persistDueViewPreference({
			...getStoredDueViewPreference(),
			filter,
		})
	}, [filter])

	if (isFocusRoute) return <Outlet />

	return (
		<DuePage
			filter={filter}
			onFilterChange={nextFilter =>
				navigate({
					to: '/due',
					search: { filter: nextFilter },
				})
			}
		/>
	)
}

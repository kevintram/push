import {
	createFileRoute,
	Outlet,
	useNavigate,
	useRouterState
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { DuePage } from '~/app/pages/DuePage'
import {
	getStoredDueViewPreference,
	isReviewFilter,
	isReviewFocusOrder,
	persistDueViewPreference
} from '~/features/review-cards/dueQueueViewPreferences'
import type {
	ReviewFilter,
	ReviewFocusOrder
} from '~/features/review-cards/types/review-card.types'

type DueRouteSearch = {
	filter?: ReviewFilter
}

type DueFocusRouteSearch = DueRouteSearch & {
	order?: ReviewFocusOrder
	shuffle?: string
}

export function validateDueSearch(
	search: Record<string, unknown>
): DueRouteSearch {
	return {
		filter: isReviewFilter(search.filter) ? search.filter : undefined
	}
}

export function validateDueFocusSearch(
	search: Record<string, unknown>
): DueFocusRouteSearch {
	const result: DueFocusRouteSearch = validateDueSearch(search)

	if (isReviewFocusOrder(search.order)) {
		result.order = search.order
	}

	if (typeof search.shuffle === 'string' && search.shuffle.trim().length > 0) {
		result.shuffle = search.shuffle
	}

	return result
}

export function resolveDueFilter(search: DueRouteSearch): ReviewFilter {
	return search.filter ?? getStoredDueViewPreference().filter
}

export function resolveDueFocusOrder(
	search: DueFocusRouteSearch
): ReviewFocusOrder {
	return search.order ?? getStoredDueViewPreference().focusOrder
}

export const Route = createFileRoute('/_main/due')({
	validateSearch: validateDueSearch,
	component: DueRoute
})

function DueRoute() {
	const navigate = useNavigate()
	const search = Route.useSearch()
	const pathname = useRouterState({ select: state => state.location.pathname })
	const filter = resolveDueFilter(search)
	const isFocusRoute = pathname.startsWith('/due/focus')

	useEffect(() => {
		persistDueViewPreference({
			...getStoredDueViewPreference(),
			filter
		})
	}, [filter])

	if (isFocusRoute) return <Outlet />

	return (
		<DuePage
			filter={filter}
			onFilterChange={nextFilter =>
				navigate({
					to: '/due',
					search: { filter: nextFilter }
				})
			}
		/>
	)
}

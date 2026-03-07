import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PinnedPage, type PinnedPageFilter } from '~/app/pages/PinnedPage'

type PinnedRouteSearch = {
	filter?: PinnedPageFilter
}

function isPinnedPageFilter(value: unknown): value is PinnedPageFilter {
	return value === 'all' || value === 'practice' || value === 'flashcard'
}

export function validatePinnedSearch(
	search: Record<string, unknown>
): PinnedRouteSearch {
	return {
		filter: isPinnedPageFilter(search.filter) ? search.filter : undefined
	}
}

export const Route = createFileRoute('/_main/pinned')({
	validateSearch: validatePinnedSearch,
	component: PinnedRoute
})

function PinnedRoute() {
	const navigate = useNavigate()
	const search = Route.useSearch()
	const filter = search.filter ?? 'all'

	return (
		<PinnedPage
			filter={filter}
			onFilterChange={nextFilter =>
				navigate({
					to: '/pinned',
					search: nextFilter === 'all' ? {} : { filter: nextFilter }
				})
			}
		/>
	)
}

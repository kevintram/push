import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FlaggedPage, type FlaggedPageFilter } from '~/app/pages/FlaggedPage'

type FlaggedRouteSearch = {
	filter?: FlaggedPageFilter
}

function isFlaggedPageFilter(value: unknown): value is FlaggedPageFilter {
	return value === 'all' || value === 'practice' || value === 'flashcard'
}

export function validateFlaggedSearch(
	search: Record<string, unknown>
): FlaggedRouteSearch {
	return {
		filter: isFlaggedPageFilter(search.filter) ? search.filter : undefined
	}
}

export const Route = createFileRoute('/_main/flagged')({
	validateSearch: validateFlaggedSearch,
	component: FlaggedRoute
})

function FlaggedRoute() {
	const navigate = useNavigate()
	const search = Route.useSearch()
	const filter = search.filter ?? 'all'

	return (
		<FlaggedPage
			filter={filter}
			onFilterChange={nextFilter =>
				navigate({
					to: '/flagged',
					search: nextFilter === 'all' ? {} : { filter: nextFilter }
				})
			}
		/>
	)
}

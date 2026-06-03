import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FlaggedPage, type FlaggedPageFilter } from '~/app/pages/FlaggedPage'

type FlaggedRouteSearch = {
	filter?: FlaggedPageFilter
}

function isFlaggedPageFilter(value: unknown): value is FlaggedPageFilter {
	return value === 'all' || value === 'practice' || value === 'flashcard'
}

export const Route = createFileRoute('/_main/flagged')({
	validateSearch: (search): FlaggedRouteSearch => ({
		filter: isFlaggedPageFilter(search.filter) ? search.filter : undefined
	}),
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

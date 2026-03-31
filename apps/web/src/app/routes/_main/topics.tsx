import { createFileRoute } from '@tanstack/react-router'
import { TopicsPage } from '~/app/pages/TopicsPage'

interface TopicsRouteSearch {
	create?: boolean
}

function validateTopicsSearch(
	search: Record<string, unknown>
): TopicsRouteSearch {
	return {
		create: search.create === true || search.create === 'true' || undefined
	}
}

export const Route = createFileRoute('/_main/topics')({
	validateSearch: validateTopicsSearch,
	component: TopicsRoute
})

function TopicsRoute() {
	const search = Route.useSearch()

	return <TopicsPage create={search.create} />
}

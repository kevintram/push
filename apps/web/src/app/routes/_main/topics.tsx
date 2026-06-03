import { createFileRoute } from '@tanstack/react-router'
import { TopicsPage } from '~/app/pages/TopicsPage'

interface TopicsRouteSearch {
	create?: boolean
}

export const Route = createFileRoute('/_main/topics')({
	validateSearch: (search): TopicsRouteSearch => ({
		create: search.create === true || search.create === 'true' || undefined
	}),
	component: TopicsRoute
})

function TopicsRoute() {
	const search = Route.useSearch()

	return <TopicsPage create={search.create} />
}

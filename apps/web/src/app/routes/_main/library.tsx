import { createFileRoute } from '@tanstack/react-router'
import { LibraryPage } from '~/app/pages/LibraryPage'

interface LibraryRouteSearch {
	create?: boolean
}

export const Route = createFileRoute('/_main/library')({
	validateSearch: (search): LibraryRouteSearch => ({
		create: search.create === true || search.create === 'true' || undefined
	}),
	component: LibraryRoute
})

function LibraryRoute() {
	const search = Route.useSearch()

	return <LibraryPage create={search.create} />
}

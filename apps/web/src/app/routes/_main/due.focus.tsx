import { createFileRoute } from '@tanstack/react-router'
import { DueFocusPage } from '~/app/pages/DueFocusPage'
import {
	resolveDueFilter,
	resolveDueFocusOrder,
	validateDueFocusSearch
} from '~/app/routes/_main/due'

export const Route = createFileRoute('/_main/due/focus')({
	validateSearch: validateDueFocusSearch,
	component: DueFocusRoute
})

function DueFocusRoute() {
	const search = Route.useSearch()
	const filter = resolveDueFilter(search)
	const order = resolveDueFocusOrder(search)

	return <DueFocusPage filter={filter} order={order} shuffle={search.shuffle} />
}

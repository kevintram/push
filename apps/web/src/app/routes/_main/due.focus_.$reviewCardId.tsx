import { createFileRoute } from '@tanstack/react-router'
import { DueFocusPage } from '~/app/pages/DueFocusPage'
import {
	resolveDueFilter,
	resolveDueFocusOrder,
	validateDueFocusSearch
} from '~/app/routes/_main/due'

export const Route = createFileRoute('/_main/due/focus_/$reviewCardId')({
	validateSearch: validateDueFocusSearch,
	component: DueFocusCardRoute
})

function DueFocusCardRoute() {
	const { reviewCardId } = Route.useParams()
	const search = Route.useSearch()
	const filter = resolveDueFilter(search)
	const order = resolveDueFocusOrder(search)

	return (
		<DueFocusPage
			filter={filter}
			order={order}
			reviewCardId={Number(reviewCardId)}
			shuffle={search.shuffle}
		/>
	)
}

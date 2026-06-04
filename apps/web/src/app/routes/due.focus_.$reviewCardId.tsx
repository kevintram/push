import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import {
	resolveDueFilter,
	resolveDueFocusOrder,
	validateDueFocusSearch
} from '~/app/routes/due'
import { buildFocusSearch } from '~/modules/review-cards/reviewFocusSearch'

export const Route = createFileRoute('/due/focus_/$reviewCardId')({
	validateSearch: validateDueFocusSearch,
	component: DueFocusCardRoute
})

function DueFocusCardRoute() {
	const navigate = useNavigate()
	const { reviewCardId } = Route.useParams()
	const search = Route.useSearch()
	const filter = resolveDueFilter(search)
	const order = resolveDueFocusOrder(search)
	const card = Number(reviewCardId)

	useEffect(() => {
		navigate({
			to: '/due/focus',
			search: buildFocusSearch({
				card,
				done: search.done,
				filter,
				include_future: search.include_future,
				order,
				shuffle: search.shuffle
			}),
			replace: true
		})
	}, [
		card,
		filter,
		navigate,
		order,
		search.done,
		search.include_future,
		search.shuffle
	])

	return null
}

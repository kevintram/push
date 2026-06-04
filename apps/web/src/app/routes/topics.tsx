import { createFileRoute, redirect } from '@tanstack/react-router'

interface TopicsRouteSearch {
	create?: boolean
}

export const Route = createFileRoute('/topics')({
	validateSearch: (search): TopicsRouteSearch => ({
		create: search.create === true || search.create === 'true' || undefined
	}),
	beforeLoad: ({ search }) => {
		throw redirect({
			to: '/library',
			search
		})
	}
})

import { createFileRoute } from '@tanstack/react-router'

import { ReviewListPage } from '~/app/pages/ReviewListPage'
import { reviewCardQueries } from '~/modules/reviews/api/queries'
import { getTodayAsString } from '~/utils/date'

export const Route = createFileRoute('/review/due')({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(
			reviewCardQueries.list({ due: getTodayAsString() }),
		),
	component: () => (
		<ReviewListPage filters={{ due: getTodayAsString() }} title='Due' />
	),
})

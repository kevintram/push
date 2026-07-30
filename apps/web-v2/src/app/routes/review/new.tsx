import { createFileRoute } from '@tanstack/react-router'

import { ReviewListPage } from '~/app/pages/ReviewListPage'
import { reviewCardQueries } from '~/modules/reviews/api/queries'

export const Route = createFileRoute('/review/new')({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(
			reviewCardQueries.list({ due: 'new' }),
		),
	component: () => <ReviewListPage filters={{ due: 'new' }} title='New' />,
})

import { createFileRoute } from '@tanstack/react-router'

import { ReviewListPage } from '~/app/pages/ReviewListPage'
import { reviewCardQueries } from '~/modules/reviews/api/queries'

export const Route = createFileRoute('/review/late')({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(
			reviewCardQueries.list({ due: 'late' }),
		),
	component: () => <ReviewListPage filters={{ due: 'late' }} title='Late' />,
})

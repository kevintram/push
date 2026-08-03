import { createFileRoute } from '@tanstack/react-router'

import { ReviewListPage } from '~/app/pages/ReviewListPage'

export const Route = createFileRoute('/review/late')({
	component: () => <ReviewListPage title='Late' />,
})

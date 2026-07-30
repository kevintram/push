import { createFileRoute } from '@tanstack/react-router'

import { ReviewListPage } from '~/app/pages/ReviewListPage'

export const Route = createFileRoute('/review/new')({
	component: () => <ReviewListPage filters={{ due: 'new' }} title='New' />,
})

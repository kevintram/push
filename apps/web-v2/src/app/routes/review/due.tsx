import { createFileRoute } from '@tanstack/react-router'

import { ReviewListPage } from '~/app/pages/ReviewListPage'
import { getTodayAsString } from '~/utils/date'

export const Route = createFileRoute('/review/due')({
	component: () => (
		<ReviewListPage filters={{ due: getTodayAsString() }} title='Due' />
	),
})

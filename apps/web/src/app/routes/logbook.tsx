import { createFileRoute } from '@tanstack/react-router'

import { LogbookPage } from '~/app/pages/LogbookPage'

export const Route = createFileRoute('/logbook')({
	component: LogbookPage,
})

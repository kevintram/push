import { createFileRoute } from '@tanstack/react-router'

import { FlaggedPage } from '~/app/pages/FlaggedPage'

export const Route = createFileRoute('/flagged')({
	component: FlaggedPage,
})

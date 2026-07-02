import { createFileRoute } from '@tanstack/react-router'

import { PinnedPage } from '~/app/pages/PinnedPage'

export const Route = createFileRoute('/pinned')({
	component: PinnedPage,
})

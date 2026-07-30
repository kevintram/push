import { createFileRoute } from '@tanstack/react-router'

import { LibraryPageLayout } from '~/app/pages/LibraryPageLayout'

export const Route = createFileRoute('/library')({
	component: LibraryPageLayout,
})

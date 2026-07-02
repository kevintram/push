import { createFileRoute } from '@tanstack/react-router'

import { LibraryPage } from '~/app/pages/LibraryPage'

export const Route = createFileRoute('/library')({
	component: LibraryPage,
})

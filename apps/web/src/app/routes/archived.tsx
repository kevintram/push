import { createFileRoute } from '@tanstack/react-router'
import { ArchivedPage } from '~/app/pages/ArchivedPage'

export const Route = createFileRoute('/archived')({
	component: ArchivedPage
})

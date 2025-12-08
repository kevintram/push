import { createFileRoute } from '@tanstack/react-router'
import { RecentPage } from '~/app/pages/RecentPage'

export const Route = createFileRoute('/recent')({
	component: RecentPage
})

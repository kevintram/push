import { createFileRoute } from '@tanstack/react-router'
import { UpcomingPage } from '~/app/pages/UpcomingPage'

export const Route = createFileRoute('/_main/upcoming')({
	component: UpcomingPage
})

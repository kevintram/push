import { createFileRoute } from '@tanstack/react-router'
import { ScheduledPage } from '~/app/pages/ScheduledPage'

export const Route = createFileRoute('/_main/scheduled')({
	component: ScheduledPage
})

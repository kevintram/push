import { createFileRoute } from '@tanstack/react-router'
import { UnscheduledPage } from '~/app/pages/UnscheduledPage'

export const Route = createFileRoute('/_main/unscheduled')({
	component: UnscheduledPage
})

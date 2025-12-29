import { createFileRoute } from '@tanstack/react-router'
import { OverviewPage } from '~/app/pages/OverviewPage'

export const Route = createFileRoute('/_main/overview')({
	component: OverviewPage
})

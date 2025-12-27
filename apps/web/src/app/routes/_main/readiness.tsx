import { createFileRoute } from '@tanstack/react-router'
import { ReadinessPage } from '~/app/pages/ReadinessPage'

export const Route = createFileRoute('/_main/readiness')({
	component: ReadinessPage
})

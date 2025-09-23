import { createFileRoute } from '@tanstack/react-router'
import { TimelinePage } from '~/features/timeline'

export const Route = createFileRoute('/')({
	component: TimelinePage
})

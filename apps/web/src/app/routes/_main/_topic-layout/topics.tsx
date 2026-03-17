import { createFileRoute } from '@tanstack/react-router'
import { TopicsPage } from '~/app/pages/TopicsPage'

export const Route = createFileRoute('/_main/_topic-layout/topics')({
	component: TopicsPage
})

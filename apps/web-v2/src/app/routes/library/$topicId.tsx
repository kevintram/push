import { createFileRoute } from '@tanstack/react-router'

import { TopicPage } from '~/app/pages/TopicPage'

export const Route = createFileRoute('/library/$topicId')({
	component: TopicPage,
})

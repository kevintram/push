import { createFileRoute } from '@tanstack/react-router'
import { TopicHub } from '~/features/topic-hub'

export const Route = createFileRoute('/topics')({
  component: TopicHub,
})
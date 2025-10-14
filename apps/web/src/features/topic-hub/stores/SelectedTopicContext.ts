import { createContext } from 'react'
import type { Topic } from '~/types/topics.types'

export const TopicContext = createContext<{
	topic: Topic | undefined
	onTopicChange?: (topic: Topic) => void
}>({
	topic: undefined,
	onTopicChange: undefined
})

import { createContext } from 'react'
import type { Topic } from '~/types/topics.types'

export const TopicHubContext = createContext<{
	selectedTopic: Topic | undefined
	topics: Map<number, Topic>
}>({
	selectedTopic: undefined,
	topics: new Map()
})

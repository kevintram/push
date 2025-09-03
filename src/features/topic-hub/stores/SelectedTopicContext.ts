import { createContext } from 'react'
import type { Topic } from '~/types/topics.types'

export const SelectedTopicContext = createContext<{
	selectedTopic: Topic | undefined
}>({
	selectedTopic: undefined
})

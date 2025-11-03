import { createContext } from 'react'
import type { Topic } from '~/models/todo-topic.types'

export const TopicContext = createContext<{
	topic: Topic | undefined
	isLoading: boolean
}>({
	topic: undefined,
	isLoading: false
})

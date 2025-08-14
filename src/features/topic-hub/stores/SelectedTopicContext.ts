import { createContext } from 'react'

export const SelectedTopicContext = createContext<{
	selectedTopicId: string | null
}>({
	selectedTopicId: null
})

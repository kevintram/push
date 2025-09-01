import { createContext } from 'react'

export const SelectedTopicIdContext = createContext<{
	selectedTopicId: number | undefined
}>({
	selectedTopicId: undefined,
})

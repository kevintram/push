import { createContext, type Dispatch, type SetStateAction } from 'react'
import type { Topic } from '~/types/topics.types'

export const SelectedTopicContext = createContext<{
	selectedTopic: Topic | undefined
	setSelectedTopic: Dispatch<SetStateAction<Topic | undefined>>
}>({
	selectedTopic: undefined,
	setSelectedTopic: () => {
		/* noop */
	}
})

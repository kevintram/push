import { createContext } from 'react'

export interface TopicDialogContextValue {
	openTopicDialog: (topicId: number) => void
	closeTopicDialog: () => void
}

export const TopicDialogContext = createContext<TopicDialogContextValue | null>(
	null
)

import { createContext } from 'react'

export interface TopicDialogContextValue {
	isOpen: boolean
	selectedTopicId: number | undefined
	openTopicDialog: (topicId: number) => void
	closeTopicDialog: () => void
}

export const TopicDialogContext = createContext<TopicDialogContextValue | null>(
	null
)

import { createContext } from 'react'

export interface TopicDialogContextValue {
	// State
	topicDialogState: { isOpen: boolean; topicId: number | undefined }

	// Topic actions
	openTopicDialog: (topicId: number) => void
	closeTopicDialog: () => void
	maximizeTopicDialog: () => void
}

export const TopicDialogContext = createContext<TopicDialogContextValue | null>(
	null
)

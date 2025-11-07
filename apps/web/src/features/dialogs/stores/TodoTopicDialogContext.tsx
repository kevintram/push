import { createContext } from 'react'

export interface TodoTopicDialogContextValue {
	// State
	topicDialogState: { isOpen: boolean; topicId: number | undefined }
	todoDialogState: { isOpen: boolean; todoId: number | undefined }

	// Topic actions
	openTopicDialog: (topicId: number) => void
	closeTopicDialog: () => void
	maximizeTopicDialog: () => void

	// Todo actions
	openTodoDialog: (todoId: number) => void
	closeTodoDialog: () => void
}

export const TodoTopicDialogContext =
	createContext<TodoTopicDialogContextValue | null>(null)

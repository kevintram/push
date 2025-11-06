import { createContext } from 'react'

export interface TodoDialogContextValue {
	isOpen: boolean
	selectedTodoId: number | undefined
	openTodoDialog: (todoId: number) => void
	closeTodoDialog: () => void
}

export const TodoDialogContext = createContext<TodoDialogContextValue | null>(
	null
)

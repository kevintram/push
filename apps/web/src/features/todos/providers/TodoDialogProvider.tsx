import { useCallback, useMemo, useState } from 'react'
import { TodoDialogContext } from '../stores/TodoDialogContext'

export function TodoDialogProvider({
	children
}: {
	children: React.ReactNode
}) {
	const [isOpen, setIsOpen] = useState(false)
	const [selectedTodoId, setSelectedTodoId] = useState<number | undefined>()

	const openTodoDialog = useCallback((todoId: number) => {
		setIsOpen(true)
		setSelectedTodoId(todoId)
	}, [])

	const closeTodoDialog = useCallback(() => {
		setIsOpen(false)
		setSelectedTodoId(undefined)
	}, [])

	const contextValue = useMemo(
		() => ({ isOpen, selectedTodoId, openTodoDialog, closeTodoDialog }),
		[isOpen, selectedTodoId, openTodoDialog, closeTodoDialog]
	)

	return <TodoDialogContext value={contextValue}>{children}</TodoDialogContext>
}

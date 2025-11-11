import { useCallback, useMemo, useState } from 'react'
import { TodoDialog } from '~/features/due/components/TodoDialog'
import { TopicDialog } from '~/features/topics/components/TopicDialog'
import { TodoTopicDialogContext } from '../stores/TodoTopicDialogContext'

export function TodoTopicDialogProvider({
	children
}: {
	children: React.ReactNode
}) {
	const [topicDialog, setTopicDialog] = useState<{
		isOpen: boolean
		topicId: number | undefined
	}>({ isOpen: false, topicId: undefined })

	const [todoDialog, setTodoDialog] = useState<{
		isOpen: boolean
		todoId: number | undefined
	}>({ isOpen: false, todoId: undefined })

	const openTopicDialog = useCallback(
		(topicId: number) => {
			// If todo dialog is open, close it but keep the ID for potential reopen
			if (todoDialog.isOpen) {
				setTodoDialog(prev => ({ ...prev, isOpen: false }))
			}
			// Open topic dialog
			setTopicDialog({ isOpen: true, topicId })
		},
		[todoDialog.isOpen]
	)

	const openTodoDialog = useCallback(
		(todoId: number) => {
			// If topic dialog is open, close it but keep the ID for potential reopen
			if (topicDialog.isOpen) {
				setTopicDialog(prev => ({ ...prev, isOpen: false }))
			}
			// Open todo dialog
			setTodoDialog({ isOpen: true, todoId })
		},
		[topicDialog.isOpen]
	)

	const closeTopicDialog = useCallback(() => {
		const shouldReopenTodo = todoDialog.todoId !== undefined

		// Close topic dialog and clear its ID
		setTopicDialog({ isOpen: false, topicId: undefined })

		// If todo was previously open, reopen it
		if (shouldReopenTodo) {
			setTodoDialog(prev => ({ ...prev, isOpen: true }))
		}
	}, [todoDialog.todoId])

	const closeTodoDialog = useCallback(() => {
		const shouldReopenTopic = topicDialog.topicId !== undefined

		// Close todo dialog and clear its ID
		setTodoDialog({ isOpen: false, todoId: undefined })

		// If topic was previously open, reopen it
		if (shouldReopenTopic) {
			setTopicDialog(prev => ({ ...prev, isOpen: true }))
		}
	}, [topicDialog.topicId])

	const maximizeTopicDialog = useCallback(() => {
		// Clear everything so nothing reopens
		setTopicDialog({ isOpen: false, topicId: undefined })
		setTodoDialog({ isOpen: false, todoId: undefined })
	}, [])

	const contextValue = useMemo(
		() => ({
			topicDialogState: topicDialog,
			todoDialogState: todoDialog,
			openTopicDialog,
			closeTopicDialog,
			maximizeTopicDialog,
			openTodoDialog,
			closeTodoDialog
		}),
		[
			topicDialog,
			todoDialog,
			openTopicDialog,
			closeTopicDialog,
			maximizeTopicDialog,
			openTodoDialog,
			closeTodoDialog
		]
	)

	return (
		<TodoTopicDialogContext value={contextValue}>
			{children}
			<TopicDialog />
			<TodoDialog />
		</TodoTopicDialogContext>
	)
}

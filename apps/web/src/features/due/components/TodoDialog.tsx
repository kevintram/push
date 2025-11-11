import { X } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { Dialog, DialogContent } from '~/components/ui/Dialog'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { useTodoWithTopics } from '../hooks/useTodoWithTopics'
import { TodoContext } from '../stores/SelectedTodoContext'
import { TodoDetail } from './TodoDetail/TodoDetail'

export function TodoDialog() {
	const { todoDialogState, closeTodoDialog } = useTodoTopicDialog()
	const { isOpen, todoId: selectedTodoId } = todoDialogState
	const { todo, isLoading } = useTodoWithTopics(selectedTodoId)

	const handleDelete = useCallback(() => {
		closeTodoDialog()
	}, [closeTodoDialog])

	const headerActions = useMemo(
		() => (
			<Button
				className='h-6 w-6 p-0 text-muted-foreground'
				onClick={closeTodoDialog}
				size='sm'
				variant='ghost'
			>
				<X className='h-4 w-4' />
			</Button>
		),
		[closeTodoDialog]
	)

	const contextValue = useMemo(
		() => ({
			todo,
			isLoading
		}),
		[todo, isLoading]
	)

	if (!selectedTodoId) {
		return null
	}

	return (
		<Dialog onOpenChange={closeTodoDialog} open={isOpen}>
			<DialogContent
				className='h-full w-full p-0 md:max-h-[600px] md:max-w-[600px] lg:max-w-[700px]'
				showCloseButton={false}
			>
				<TodoContext value={contextValue}>
					<TodoDetail headerActions={headerActions} onDelete={handleDelete} />
				</TodoContext>
			</DialogContent>
		</Dialog>
	)
}

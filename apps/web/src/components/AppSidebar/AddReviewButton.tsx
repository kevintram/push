import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BookPlus } from 'lucide-react'
import { useCallback } from 'react'
import { SidebarMenuButton } from '~/components/ui/Sidebar'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { createTodo } from '~/features/due/api'

export function AddReviewButton() {
	const { openTodoDialog } = useTodoTopicDialog()

	const queryClient = useQueryClient()

	const { mutateAsync: createTodoMutation } = useMutation({
		mutationFn: createTodo,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const handleAddTodo = useCallback(async () => {
		const todo = await createTodoMutation({
			description: '',
			scheduledAt: null,
			completedAt: null
		})

		openTodoDialog(todo.id)
	}, [createTodoMutation, openTodoDialog])

	return (
		<SidebarMenuButton
			onClick={handleAddTodo}
			tooltip='Add Todo'
			variant='secondary'
		>
			<BookPlus />
			<span>Add Todo</span>
		</SidebarMenuButton>
	)
}

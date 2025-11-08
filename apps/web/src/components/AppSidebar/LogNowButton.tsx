import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { BookCheck } from 'lucide-react'
import { useCallback } from 'react'
import { SidebarMenuButton } from '~/components/ui/Sidebar'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { createTodo } from '~/features/todos/api'

export function LogNowButton() {
	const { openTodoDialog } = useTodoTopicDialog()

	const queryClient = useQueryClient()

	const { mutateAsync: createTodoMutation } = useMutation({
		mutationFn: createTodo,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const handleLogNow = useCallback(async () => {
		const todo = await createTodoMutation({
			description: '',
			scheduledAt: null,
			completedAt: dayjs().format('YYYY-MM-DD')
		})

		openTodoDialog(todo.id)
	}, [createTodoMutation, openTodoDialog])

	return (
		<SidebarMenuButton
			onClick={handleLogNow}
			tooltip='Log Review Now'
			variant='secondary'
		>
			<BookCheck />
			<span>Log Now</span>
		</SidebarMenuButton>
	)
}

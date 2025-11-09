import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { BookCheck, Plus, SquarePen, SquarePlus } from 'lucide-react'
import { useCallback } from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { SidebarMenuButton } from '~/components/ui/Sidebar'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { createTodo } from '~/features/todos/api'
import { useCreateTopic } from '~/features/topics/api/useCreateTopic'

export function CombinedActionButton() {
	const { mutateAsync: insertTopic, isPending: isCreatingTopic } =
		useCreateTopic()
	const { openTopicDialog, openTodoDialog } = useTodoTopicDialog()
	const queryClient = useQueryClient()

	const { mutateAsync: createTodoMutation } = useMutation({
		mutationFn: createTodo,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const handleCreateTopic = useCallback(async () => {
		const createdTopic = await insertTopic({ inboxed: true })
		openTopicDialog(createdTopic.id)
	}, [insertTopic, openTopicDialog])

	const handleAddReview = useCallback(async () => {
		const todo = await createTodoMutation({
			description: '',
			scheduledAt: null,
			completedAt: null
		})
		openTodoDialog(todo.id)
	}, [createTodoMutation, openTodoDialog])

	const handleLogNow = useCallback(async () => {
		const todo = await createTodoMutation({
			description: '',
			scheduledAt: null,
			completedAt: dayjs().format('YYYY-MM-DD')
		})
		openTodoDialog(todo.id)
	}, [createTodoMutation, openTodoDialog])

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild={true}>
				<SidebarMenuButton
					tooltip='Add Topic, Todo, or Review Now'
					variant='secondary'
				>
					<Plus />
					<span>Add</span>
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start'>
				<DropdownMenuItem
					disabled={isCreatingTopic}
					onClick={handleCreateTopic}
				>
					<SquarePen />
					<span>Add Topic</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleAddReview}>
					<SquarePlus />
					<span>Add Todo</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleLogNow}>
					<BookCheck />
					<span>Log Review</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

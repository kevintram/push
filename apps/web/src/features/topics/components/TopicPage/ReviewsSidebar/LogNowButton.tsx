import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { BookCheck } from 'lucide-react'
import { use, useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { addTopicToTodo, createTodo } from '~/features/todos/api'
import { TopicContext } from '../../../stores/SelectedTopicContext'

export function LogNowButton() {
	const { topic: selectedTopic } = use(TopicContext)
	const { openTodoDialog } = useTodoTopicDialog()

	const queryClient = useQueryClient()

	const { mutateAsync: createTodoMutation } = useMutation({
		mutationFn: createTodo,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const { mutateAsync: addTopicMutation } = useMutation({
		mutationFn: ({ todoId, topicId }: { todoId: number; topicId: number }) =>
			addTopicToTodo(todoId, topicId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const handleLogNow = useCallback(async () => {
		if (!selectedTopic) return

		const todo = await createTodoMutation({
			description: '',
			scheduledAt: null,
			completedAt: dayjs().format('YYYY-MM-DD')
		})

		await addTopicMutation({ todoId: todo.id, topicId: selectedTopic.id })
		openTodoDialog(todo.id)
	}, [selectedTopic, createTodoMutation, addTopicMutation, openTodoDialog])

	return (
		<Tooltip>
			<TooltipTrigger asChild={true}>
				<Button onClick={handleLogNow} size='sm' variant='ghost'>
					<BookCheck className='h-4 w-4' />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Log Now</TooltipContent>
		</Tooltip>
	)
}

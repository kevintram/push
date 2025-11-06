import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { use, useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { addTopicToTodo, createTodo } from '~/features/todos/api'
import { TopicContext } from '../../../stores/SelectedTopicContext'

export function AddReviewButton() {
	const { topic: selectedTopic } = use(TopicContext)

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

	const handleAddTodo = useCallback(async () => {
		if (!selectedTopic) return

		const todo = await createTodoMutation({
			description: '',
			scheduledAt: null,
			completedAt: null
		})

		await addTopicMutation({ todoId: todo.id, topicId: selectedTopic.id })
	}, [selectedTopic, createTodoMutation, addTopicMutation])

	return (
		<Button onClick={handleAddTodo} size='sm' variant='ghost'>
			<Plus className='h-4 w-4' />
		</Button>
	)
}

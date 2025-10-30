import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { use, useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { createTodo } from '~/features/todos/api'
import { TopicContext } from '../../../stores/SelectedTopicContext'
import { useTimelineData } from './TimelineDataContext'

export function AddUnscheduledTodoButton() {
	const { topic: selectedTopic } = use(TopicContext)
	const { addTopicToTodo } = useTimelineData()

	const queryClient = useQueryClient()

	const { mutateAsync: createTodoMutation } = useMutation({
		mutationFn: createTodo,
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

		await addTopicToTodo(todo.id, selectedTopic.id)
	}, [selectedTopic, createTodoMutation, addTopicToTodo])

	return (
		<Button onClick={handleAddTodo} size='sm' variant='ghost'>
			<Plus className='h-4 w-4' />
		</Button>
	)
}

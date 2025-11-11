import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { use, useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { createTodo } from '~/features/due/api'
import { createReview } from '~/features/reviews/api'
import { TopicContext } from '../../../stores/SelectedTopicContext'

export function AddReviewButton() {
	const { topic: selectedTopic } = use(TopicContext)
	const { openTodoDialog } = useTodoTopicDialog()

	const queryClient = useQueryClient()

	const { mutateAsync: createTodoMutation } = useMutation({
		mutationFn: createTodo,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const { mutateAsync: createReviewMutation } = useMutation({
		mutationFn: ({ todoId, topicId }: { todoId: number; topicId: number }) =>
			createReview(todoId, topicId, 'good'),
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

		await createReviewMutation({ todoId: todo.id, topicId: selectedTopic.id })
		openTodoDialog(todo.id)
	}, [selectedTopic, createTodoMutation, createReviewMutation, openTodoDialog])

	return (
		<Tooltip>
			<TooltipTrigger asChild={true}>
				<Button onClick={handleAddTodo} size='sm' variant='ghost'>
					<Plus className='h-4 w-4' />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Add Review</TooltipContent>
		</Tooltip>
	)
}

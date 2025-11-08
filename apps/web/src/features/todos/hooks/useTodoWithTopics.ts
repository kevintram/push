import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Todo } from '~/models/todo-topic.types'
import { getTodo } from '../api/getTodo'

/**
 * Hook to fetch a todo with its associated topics
 */
export function useTodoWithTopics(todoId: number | undefined) {
	const { data: todoData, isLoading } = useQuery({
		queryKey: ['todos', todoId],
		queryFn: () => getTodo(todoId!),
		enabled: todoId !== undefined
	})

	const todo: Todo | undefined = useMemo(() => {
		if (!todoData) return

		return {
			...todoData,
			topics: todoData.topics ?? []
		}
	}, [todoData])

	return { todo, isLoading }
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState
} from 'react'
import {
	type Todo as ApiTodo,
	addTopicToTodo,
	deleteTodo as deleteTodoApi,
	getTodos,
	removeTopicFromTodo,
	updateTodo as updateTodoApi
} from '~/features/todos/api'
import type { Topic } from '~/models/todo-topic.types'

// Enhanced types for todos with topics
export type TodoWithTopics = ApiTodo

export type TopicSummary = {
	id: number
	name: string
}

// Context interface
export interface TimelineContextValue {
	// Data
	scheduledTodos: Array<TodoWithTopics>
	unscheduledTodos: Array<TodoWithTopics>

	// Loading states
	isLoadingTodos: boolean

	// Todo operations
	updateTodo: (id: number, updates: Partial<ApiTodo>) => Promise<void>
	deleteTodo: (id: number) => Promise<void>

	// Topic operations
	addTopicToTodo: (todoId: number, topicId: number) => Promise<void>
	removeTopicFromTodo: (todoId: number, topicId: number) => Promise<void>

	// Utilities
	getTopicsForTodo: (todoId: number) => Array<TopicSummary>
	revalidateTimeline: () => void
}

export const TimelineDataContext = createContext<TimelineContextValue | null>(
	null
)

interface TimelineDataProviderProps {
	children: React.ReactNode
	selectedTopicId: number | undefined
}

export function TimelineDataProvider({
	children,
	selectedTopicId
}: TimelineDataProviderProps) {
	const [optimisticUpdates, setOptimisticUpdates] = useState<
		Map<number, Partial<ApiTodo>>
	>(new Map())

	const queryClient = useQueryClient()

	// Fetch all todos for the selected topic
	const {
		data: rawAllTodos = [],
		isLoading: isLoadingTodos,
		refetch: refetchTodos
	} = useQuery({
		queryKey: ['todos', { topicId: selectedTopicId }],
		queryFn: () => getTodos({ topicId: selectedTopicId }),
		enabled: !!selectedTopicId
	})

	// Mutations
	const { mutateAsync: updateTodoMutation } = useMutation({
		mutationFn: updateTodoApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const { mutateAsync: deleteTodoMutation } = useMutation({
		mutationFn: deleteTodoApi,
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

	const { mutateAsync: removeTopicMutation } = useMutation({
		mutationFn: ({ todoId, topicId }: { todoId: number; topicId: number }) =>
			removeTopicFromTodo(todoId, topicId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// Apply optimistic updates and split into scheduled/unscheduled
	const { scheduledTodos, unscheduledTodos } = useMemo(() => {
		const allTodosWithOptimisticUpdates = rawAllTodos.map(todo => {
			const optimisticUpdate = optimisticUpdates.get(todo.id ?? 0)
			return optimisticUpdate ? { ...todo, ...optimisticUpdate } : todo
		})

		// Split into scheduled (has effective_date) and unscheduled (no effective_date)
		const scheduled = allTodosWithOptimisticUpdates
			.filter(todo => todo.effective_date != null)
			.sort(
				(a, b) =>
					new Date(a.effective_date!).getTime() -
					new Date(b.effective_date!).getTime()
			)

		const unscheduled = allTodosWithOptimisticUpdates
			.filter(todo => todo.effective_date == null)
			.sort(
				(a, b) =>
					new Date(b.inserted_at!).getTime() -
					new Date(a.inserted_at!).getTime()
			)

		return { scheduledTodos: scheduled, unscheduledTodos: unscheduled }
	}, [rawAllTodos, optimisticUpdates])

	// Operations
	const updateTodo = useCallback(
		async (id: number, updates: Partial<ApiTodo>) => {
			// Apply optimistic update
			setOptimisticUpdates(prev => new Map(prev).set(id, updates))

			try {
				await updateTodoMutation({ id, ...updates })
			} finally {
				// Remove optimistic update after mutation completes
				setOptimisticUpdates(prev => {
					const newMap = new Map(prev)
					newMap.delete(id)
					return newMap
				})
			}
		},
		[updateTodoMutation]
	)

	const deleteTodo = useCallback(
		async (id: number) => {
			await deleteTodoMutation(id)
		},
		[deleteTodoMutation]
	)

	const addTopicToTodoFn = useCallback(
		async (todoId: number, topicId: number) => {
			await addTopicMutation({ todoId, topicId })
		},
		[addTopicMutation]
	)

	const removeTopicFromTodoFn = useCallback(
		async (todoId: number, topicId: number) => {
			await removeTopicMutation({ todoId, topicId })
		},
		[removeTopicMutation]
	)

	const getTopicsForTodo = useCallback(
		(todoId: number): Array<TopicSummary> => {
			// Check both scheduled and unscheduled todos
			const allTodos = [...scheduledTodos, ...unscheduledTodos]
			const todo = allTodos.find(t => t.id === todoId)
			return (
				todo?.topics?.map((t: Topic) => ({
					id: t.id,
					name: t.name
				})) ?? []
			)
		},
		[scheduledTodos, unscheduledTodos]
	)

	const revalidateTimeline = useCallback(() => {
		refetchTodos()
		queryClient.invalidateQueries({ queryKey: ['todos'] })
	}, [refetchTodos, queryClient])

	const contextValue: TimelineContextValue = {
		scheduledTodos,
		unscheduledTodos,
		isLoadingTodos,
		updateTodo,
		deleteTodo,
		addTopicToTodo: addTopicToTodoFn,
		removeTopicFromTodo: removeTopicFromTodoFn,
		getTopicsForTodo,
		revalidateTimeline
	}

	return (
		<TimelineDataContext.Provider value={contextValue}>
			{children}
		</TimelineDataContext.Provider>
	)
}

export function useTimelineData() {
	const context = useContext(TimelineDataContext)
	if (!context) {
		throw new Error('useTimelineData must be used within TimelineDataProvider')
	}
	return context
}

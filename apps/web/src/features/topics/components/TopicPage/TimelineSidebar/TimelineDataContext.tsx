import {
	useDeleteMutation,
	useInsertMutation,
	useQuery,
	useRevalidateTables
} from '@supabase-cache-helpers/postgrest-react-query'
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState
} from 'react'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

// Enhanced types for todos with topics
export type TodoWithTopics = Tables<'todos_with_effective_date'> & {
	todos_topics: Array<{ topics: Tables<'topics'> }>
}

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
	updateTodo: (id: number, updates: Partial<Tables<'todos'>>) => Promise<void>
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
		Map<number, Partial<Tables<'todos'>>>
	>(new Map())

	// Central table revalidation
	const revalidateTables = useRevalidateTables([
		{ schema: 'public', table: 'todos' },
		{ schema: 'public', table: 'todos_today' },
		{ schema: 'public', table: 'todos_with_effective_date' },
		{ schema: 'public', table: 'todos_topics' }
	])

	// Fetch all todos with all their topic relationships, then filter by selected topic
	const {
		data: rawAllTodos = [],
		isLoading: isLoadingTodos,
		refetch: refetchTodos
	} = useQuery<Array<TodoWithTopics>>(
		supabase
			.from('todos_with_effective_date')
			.select('*,todos_topics(topics(*))')
			.order('inserted_at', { ascending: false }),
		{
			enabled: !!selectedTopicId
		}
	)

	// Mutations - using raw supabase due to cache helper bug
	const updateTodoMutation = useCallback(
		async (data: { id: number } & Partial<Tables<'todos'>>) => {
			const { id, ...updates } = data
			await supabase.from('todos').update(updates).eq('id', id)
			revalidateTables()
		},
		[revalidateTables]
	)

	const { mutateAsync: deleteTodoMutation } = useDeleteMutation(
		supabase.from('todos'),
		['id'],
		undefined,
		{
			onSuccess: () => revalidateTables()
		}
	)

	const { mutateAsync: insertTodoTopicMutation } = useInsertMutation(
		supabase.from('todos_topics'),
		['topic_id', 'todo_id'],
		'*',
		{
			onSuccess: () => revalidateTables()
		}
	)

	const { mutateAsync: deleteTodoTopicMutation } = useDeleteMutation(
		supabase.from('todos_topics'),
		['topic_id', 'todo_id'],
		undefined,
		{
			onSuccess: () => revalidateTables()
		}
	)

	// Apply optimistic updates and split into scheduled/unscheduled
	const { scheduledTodos, unscheduledTodos } = useMemo(() => {
		// First filter todos to only include those associated with the selected topic
		const todosForSelectedTopic = (rawAllTodos ?? []).filter(todo =>
			todo.todos_topics?.some(tt => tt.topics?.id === selectedTopicId)
		)

		const allTodosWithOptimisticUpdates = todosForSelectedTopic.map(todo => {
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
	}, [rawAllTodos, optimisticUpdates, selectedTopicId])

	// Operations
	const updateTodo = useCallback(
		async (id: number, updates: Partial<Tables<'todos'>>) => {
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
			await deleteTodoMutation({ id })
		},
		[deleteTodoMutation]
	)

	const addTopicToTodo = useCallback(
		async (todoId: number, topicId: number) => {
			await insertTodoTopicMutation([{ todo_id: todoId, topic_id: topicId }])
		},
		[insertTodoTopicMutation]
	)

	const removeTopicFromTodo = useCallback(
		async (todoId: number, topicId: number) => {
			await deleteTodoTopicMutation({ todo_id: todoId, topic_id: topicId })
		},
		[deleteTodoTopicMutation]
	)

	const getTopicsForTodo = useCallback(
		(todoId: number): Array<TopicSummary> => {
			// Check both scheduled and unscheduled todos
			const allTodos = [...scheduledTodos, ...unscheduledTodos]
			const todo = allTodos.find(t => t.id === todoId)
			return (
				todo?.todos_topics?.map(tt => ({
					id: tt.topics.id,
					name: tt.topics.name
				})) ?? []
			)
		},
		[scheduledTodos, unscheduledTodos]
	)

	const revalidateTimeline = useCallback(() => {
		refetchTodos()
		revalidateTables()
	}, [refetchTodos, revalidateTables])

	const contextValue: TimelineContextValue = {
		scheduledTodos,
		unscheduledTodos,
		isLoadingTodos,
		updateTodo,
		deleteTodo,
		addTopicToTodo,
		removeTopicFromTodo,
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

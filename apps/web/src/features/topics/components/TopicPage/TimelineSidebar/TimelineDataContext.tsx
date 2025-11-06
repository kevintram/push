import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { type Todo as ApiTodo, getTodos } from '~/features/todos/api'

// Enhanced types for todos with topics
export type TodoWithTopics = ApiTodo

// Context interface
export interface TimelineContextValue {
	// Data
	scheduledTodos: Array<TodoWithTopics>
	unscheduledTodos: Array<TodoWithTopics>

	// Loading states
	isLoadingTodos: boolean

	// Utilities
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

	// Split into scheduled/unscheduled
	const { scheduledTodos, unscheduledTodos } = useMemo(() => {
		// Split into scheduled (has effective_date) and unscheduled (no effective_date)
		const scheduled = rawAllTodos
			.filter(todo => todo.effective_date != null)
			.sort(
				(a, b) =>
					new Date(a.effective_date!).getTime() -
					new Date(b.effective_date!).getTime()
			)

		const unscheduled = rawAllTodos
			.filter(todo => todo.effective_date == null)
			.sort(
				(a, b) =>
					new Date(b.inserted_at!).getTime() -
					new Date(a.inserted_at!).getTime()
			)

		return { scheduledTodos: scheduled, unscheduledTodos: unscheduled }
	}, [rawAllTodos])

	const revalidateTimeline = useCallback(() => {
		refetchTodos()
		queryClient.invalidateQueries({ queryKey: ['todos'] })
	}, [refetchTodos, queryClient])

	const contextValue: TimelineContextValue = {
		scheduledTodos,
		unscheduledTodos,
		isLoadingTodos,
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

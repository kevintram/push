import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { addTopicToTodo, type Todo } from '~/features/todos/api'
import { searchTopics } from '~/features/topics/api/searchTopics'
import { CreateTopicDialog } from '~/features/topics/components/CreateTopicDialog'
import type { Topic } from '~/types/topics.types'

interface AddTopicToTodoDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	todo: Todo | undefined
}

export function AddTopicToTodoDialog({
	open,
	onOpenChange,
	todo
}: AddTopicToTodoDialogProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [debouncedQuery, setDebouncedQuery] = useState('')
	const queryClient = useQueryClient()

	// Debounced search query
	const updateDebouncedQuery = useCallback(
		debounce((term: string) => setDebouncedQuery(term), 300),
		[]
	)

	useEffect(() => {
		updateDebouncedQuery(searchQuery)
	}, [searchQuery, updateDebouncedQuery])

	const { data: topics = [], isLoading } = useQuery({
		queryKey: ['topics', 'search', debouncedQuery || 'recent', todo?.id],
		queryFn: () =>
			searchTopics({
				query: debouncedQuery || undefined,
				limit: 20,
				addableToTodo: todo?.id
			}),
		enabled: open && !!todo
	})

	const results = useMemo(() => {
		if (!debouncedQuery) {
			return topics?.slice(0, 10) ?? [] // Show recent topics when no search
		}
		return topics ?? []
	}, [topics, debouncedQuery])

	const { mutateAsync: addTopicMutation } = useMutation({
		mutationFn: ({ todoId, topicId }: { todoId: number; topicId: number }) =>
			addTopicToTodo(todoId, topicId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	// Reset state when dialog opens/closes
	useEffect(() => {
		if (open) {
			setSearchQuery('')
		}
	}, [open])

	const handleTopicCreatedOrSelected = useCallback(
		async (topic: Topic) => {
			if (!todo) return

			try {
				await addTopicMutation({
					todoId: todo.id,
					topicId: topic.id
				})
			} catch (_error) {
				// Handle error silently for now
			}
		},
		[todo, addTopicMutation]
	)

	const useSearch = useCallback(
		(query: string) => {
			// Update search query when CreateTopicDialog's input changes
			useEffect(() => {
				setSearchQuery(query)
			}, [query])

			return {
				results,
				isLoading,
				debouncedQuery
			}
		},
		[results, isLoading, debouncedQuery]
	)

	return (
		<CreateTopicDialog
			onOpenChange={onOpenChange}
			onTopicCreated={handleTopicCreatedOrSelected}
			open={open}
			showSidebar={true}
			sidebarTitle={query =>
				query === '' ? 'Recent Topics' : 'Matching Topics'
			}
			submitButtonText='Create & Add Topic'
			title='Add Topic to Todo'
			useSearch={useSearch}
		/>
	)
}

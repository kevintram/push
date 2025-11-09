import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { createReview } from '~/features/reviews/api'
import type { Todo } from '~/features/todos/api'
import { searchTopics } from '~/features/topics/api/searchTopics'
import { SearchOrCreateTopicDialog } from '~/features/topics/components/SearchOrCreateTopicDialog'
import type { Topic } from '~/models/todo-topic.types'

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
	const { openTopicDialog } = useTodoTopicDialog()

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

	const { mutateAsync: createReviewMutation } = useMutation({
		mutationFn: ({ todoId, topicId }: { todoId: number; topicId: number }) =>
			createReview(todoId, topicId, 'good'),
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

	const handleTopicCreated = useCallback(
		async (topic: Topic) => {
			if (!todo) return

			try {
				await createReviewMutation({
					todoId: todo.id,
					topicId: topic.id
				})

				// Open TopicDialog with newly created topic
				openTopicDialog(topic.id)
			} catch (_error) {
				// Handle error silently for now
			}
		},
		[todo, createReviewMutation, openTopicDialog]
	)

	const handleTopicSelected = useCallback(
		async (topic: Topic) => {
			if (!todo) return

			try {
				await createReviewMutation({
					todoId: todo.id,
					topicId: topic.id
				})
			} catch (_error) {
				// Handle error silently for now
			}
		},
		[todo, createReviewMutation]
	)

	const useSearch = useCallback(
		(_query: string) => {
			return {
				results,
				isLoading,
				debouncedQuery,
				hasQuery: Boolean(debouncedQuery.trim())
			}
		},
		[results, isLoading, debouncedQuery]
	)

	return (
		<SearchOrCreateTopicDialog
			onOpenChange={onOpenChange}
			onSearchQueryChange={setSearchQuery}
			onTopicCreated={handleTopicCreated}
			onTopicSelected={handleTopicSelected}
			open={open}
			title='Add Topic to Todo'
			useSearch={useSearch}
		/>
	)
}

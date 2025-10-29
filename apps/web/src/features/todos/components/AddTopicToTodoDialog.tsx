import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { addTopicToTodo, type Todo } from '~/features/todos/api'
import { CreateTopicDialog } from '~/features/topics/components/CreateTopicDialog'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

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

	// Build query conditionally to avoid 400 error when debouncedQuery is empty
	const topicsQuery = useMemo(() => {
		let query = supabase.from('topics').select('*')

		if (debouncedQuery) {
			query = query.or(
				`name.ilike.%${debouncedQuery}%,notes.ilike.%${debouncedQuery}%`
			)
		}

		return query.order('updated_at', { ascending: false }).limit(20)
	}, [debouncedQuery])

	const { data: topics = [], isLoading } = useQuery(topicsQuery, {
		enabled: open
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
		async (topic: Tables<'topics'>) => {
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

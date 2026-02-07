import { useMutation, useQueryClient } from '@tanstack/react-query'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { sourceKeys } from '~/features/sources/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { topicKeys } from './queryKeys'

export type ChildHandlingStrategy = 'delete' | 'orphan' | 'reparent'

export type DeleteTopicInput = {
	topicId: number
	handleChildrenBy?: ChildHandlingStrategy
}

export async function deleteTopic(input: DeleteTopicInput | number) {
	// Support both old signature (just topicId) and new signature (object with options)
	const { topicId, handleChildrenBy } =
		typeof input === 'number'
			? { topicId: input, handleChildrenBy: undefined }
			: input

	const url = new URL(`${import.meta.env.VITE_API_URL}/topics/${topicId}/`)
	if (handleChildrenBy) {
		url.searchParams.set('handle_children_by', handleChildrenBy)
	}

	const response = await apiFetch(url.toString(), {
		method: 'DELETE'
	})

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

type CachedRelationships = {
	practiceIds: number[] | undefined
	sourceIds: number[] | undefined
}

export function useDeleteTopic() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteTopic,
		onMutate: (input): CachedRelationships => {
			const topicId = typeof input === 'number' ? input : input.topicId
			const cached = queryClient.getQueryData<{
				practices?: Array<{ id: number }>
				sources?: Array<{ id: number }>
			}>(topicKeys.detail(topicId))
			return {
				practiceIds: cached?.practices?.map(p => p.id),
				sourceIds: cached?.sources?.map(s => s.id)
			}
		},
		onSuccess: (_, input, context) => {
			const topicId = typeof input === 'number' ? input : input.topicId
			// Invalidate all topic queries except the byId query for the deleted topic
			queryClient.invalidateQueries({
				predicate: query => {
					const queryKey = query.queryKey
					if (queryKey[0] !== 'topics') return false
					if (queryKey.length >= 2 && queryKey[1] === topicId) {
						return false
					}
					return true
				}
			})
			queryClient.invalidateQueries({
				queryKey: reviewKeys.all
			})
			// Invalidate related practices/sources; fall back to broad invalidation
			// if the detail cache wasn't populated
			if (context.practiceIds) {
				for (const id of context.practiceIds) {
					queryClient.invalidateQueries({ queryKey: practiceKeys.byId(id) })
				}
			} else {
				queryClient.invalidateQueries({ queryKey: practiceKeys.all })
			}
			if (context.sourceIds) {
				for (const id of context.sourceIds) {
					queryClient.invalidateQueries({ queryKey: sourceKeys.byId(id) })
				}
			} else {
				queryClient.invalidateQueries({ queryKey: sourceKeys.all })
			}
		}
	})
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { sourceKeys } from './queryKeys'

export type ChildHandlingStrategy = 'delete' | 'orphan' | 'reparent'

export type DeleteSourceInput = {
	sourceId: number
	handleChildrenBy?: ChildHandlingStrategy
}

export async function deleteSource(input: DeleteSourceInput | number) {
	// Support both old signature (just sourceId) and new signature (object with options)
	const { sourceId, handleChildrenBy } =
		typeof input === 'number'
			? { sourceId: input, handleChildrenBy: undefined }
			: input

	const url = new URL(`${import.meta.env.VITE_API_URL}/sources/${sourceId}/`)
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
	topicIds: number[] | undefined
}

export function useDeleteSource() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteSource,
		onMutate: (input): CachedRelationships => {
			const sourceId = typeof input === 'number' ? input : input.sourceId
			const cached = queryClient.getQueryData<{
				practices?: Array<{ id: number }>
				topics?: Array<{ id: number }>
			}>(sourceKeys.detail(sourceId))
			return {
				practiceIds: cached?.practices?.map(p => p.id),
				topicIds: cached?.topics?.map(t => t.id)
			}
		},
		onSuccess: (_, input, context) => {
			const sourceId = typeof input === 'number' ? input : input.sourceId
			// Invalidate all source queries except the byId query for the deleted source
			queryClient.invalidateQueries({
				predicate: query => {
					const queryKey = query.queryKey
					if (queryKey[0] !== 'sources') return false
					if (queryKey.length >= 2 && queryKey[1] === sourceId) {
						return false
					}
					return true
				}
			})
			queryClient.invalidateQueries({
				queryKey: reviewKeys.all
			})
			// Invalidate related practices/topics; fall back to broad invalidation
			// if the detail cache wasn't populated
			if (context.practiceIds) {
				for (const id of context.practiceIds) {
					queryClient.invalidateQueries({ queryKey: practiceKeys.byId(id) })
				}
			} else {
				queryClient.invalidateQueries({ queryKey: practiceKeys.all })
			}
			if (context.topicIds) {
				for (const id of context.topicIds) {
					queryClient.invalidateQueries({ queryKey: topicKeys.byId(id) })
				}
			} else {
				queryClient.invalidateQueries({ queryKey: topicKeys.all })
			}
		}
	})
}

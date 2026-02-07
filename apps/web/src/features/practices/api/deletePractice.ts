import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { sourceKeys } from '~/features/sources/api/queryKeys'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { practiceKeys } from './queryKeys'

export type DeletePracticeInput = {
	practiceId: number
}

export async function deletePractice(input: DeletePracticeInput | number) {
	const practiceId = typeof input === 'number' ? input : input.practiceId

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/${practiceId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

type CachedRelationships = {
	topicIds: number[] | undefined
	sourceIds: number[] | undefined
}

export function useDeletePractice() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deletePractice,
		onMutate: (input): CachedRelationships => {
			const practiceId = typeof input === 'number' ? input : input.practiceId
			const cached = queryClient.getQueryData<{
				topics?: Array<{ id: number }>
				sources?: Array<{ id: number }>
			}>(practiceKeys.detail(practiceId))
			return {
				topicIds: cached?.topics?.map(t => t.id),
				sourceIds: cached?.sources?.map(s => s.id)
			}
		},
		onSuccess: (_, input, context) => {
			const practiceId = typeof input === 'number' ? input : input.practiceId
			// Invalidate all practice queries except the byId query for the deleted practice
			queryClient.invalidateQueries({
				predicate: query => {
					const queryKey = query.queryKey
					if (queryKey[0] !== 'practices') return false
					if (queryKey.length >= 2 && queryKey[1] === practiceId) {
						return false
					}
					return true
				}
			})
			queryClient.invalidateQueries({
				queryKey: reviewKeys.all
			})
			// Invalidate related topics/sources; fall back to broad invalidation
			// if the detail cache wasn't populated
			if (context.topicIds) {
				for (const id of context.topicIds) {
					queryClient.invalidateQueries({ queryKey: topicKeys.byId(id) })
				}
			} else {
				queryClient.invalidateQueries({ queryKey: topicKeys.all })
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

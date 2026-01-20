import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'

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

export function useDeleteSource() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteSource,
		onSuccess: (_, input) => {
			const sourceId = typeof input === 'number' ? input : input.sourceId
			// Invalidate all source queries except the byId query for the deleted source
			queryClient.invalidateQueries({
				predicate: query => {
					const queryKey = query.queryKey
					// Check if it's a source query
					if (queryKey[0] !== 'sources') return false

					// Don't invalidate the byId query for the deleted source
					// byId structure: ['sources', sourceId, ...]
					if (queryKey.length >= 2 && queryKey[1] === sourceId) {
						return false
					}

					return true
				}
			})
			queryClient.invalidateQueries({
				queryKey: reviewKeys.all
			})
		}
	})
}

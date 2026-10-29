import { api } from '@convex/_generated/api'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getErrorMessage } from '~/utils/error'

/** Moves sections, with their cards, and cards to another collection. */
export function useMoveCollectionItems() {
	const mutationFn = useConvexMutation(api.collectionItems.moveToCollection)
	return useMutation({
		mutationFn,
		onError: error =>
			toast.error('Failed to move', {
				description: getErrorMessage(error),
			}),
	})
}

/** Deletes sections, with their cards, and cards. */
export function useDeleteCollectionItems() {
	const mutationFn = useConvexMutation(api.collectionItems.remove)
	return useMutation({
		mutationFn,
		onError: error =>
			toast.error('Failed to delete', {
				description: getErrorMessage(error),
			}),
	})
}

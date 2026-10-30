import { api } from '@convex/_generated/api'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'

import { toastError } from '~/components/ui/Toast'

/** Moves sections, with their cards, and cards to another collection. */
export function useMoveCollectionItems() {
	const mutationFn = useConvexMutation(api.collectionItems.moveToCollection)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to move', error),
	})
}

/** Deletes sections, with their cards, and cards. */
export function useDeleteCollectionItems() {
	const mutationFn = useConvexMutation(api.collectionItems.remove)
	return useMutation({
		mutationFn,
		onError: error => toastError('Failed to delete', error),
	})
}

import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getErrorMessage } from '~/utils/error'

export const sectionQueries = {
	listByCollection: (collectionId: Id<'collections'>) =>
		convexQuery(api.sections.listByCollection, { collectionId }),
}

export function useCreateSection() {
	const mutationFn = useConvexMutation(api.sections.create)
	return useMutation({
		mutationFn,
		onError: error =>
			toast.error('Failed to create section', {
				description: getErrorMessage(error),
			}),
	})
}

export function useUpdateSection() {
	const mutationFn = useConvexMutation(api.sections.update)
	return useMutation({
		mutationFn,
		onError: error =>
			toast.error('Failed to update section', {
				description: getErrorMessage(error),
			}),
	})
}

export function useDeleteSection() {
	const mutationFn = useConvexMutation(api.sections.remove)
	return useMutation({
		mutationFn,
		onError: error =>
			toast.error('Failed to delete section', {
				description: getErrorMessage(error),
			}),
	})
}

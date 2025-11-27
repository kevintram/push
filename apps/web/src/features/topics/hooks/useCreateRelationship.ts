import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'
import { createParentRelationship } from '../api/createTopicRelationship'

export function useCreateRelationship(onSuccess?: () => void) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			parent,
			child
		}: {
			parent: number
			child: number
		}) => {
			return createParentRelationship({ childId: child, parentId: parent })
		},
		onSuccess: async () => {
			onSuccess?.()

			// Invalidate topic and review caches
			await invalidateTopicsAndReviews(queryClient)

			// Invalidate potential relationships cache since the graph has changed
			await queryClient.invalidateQueries({
				queryKey: ['potential-children']
			})
			await queryClient.invalidateQueries({
				queryKey: ['potential-parents']
			})
		}
	})
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
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

			// Invalidate topics cache
			await queryClient.invalidateQueries({ queryKey: ['topics'] })

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

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteParentRelationship } from '../api/deleteTopicRelationship'

export function useDeleteRelationship() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			parent,
			child
		}: {
			parent: number
			child: number
		}) => {
			return deleteParentRelationship({ childId: child, parentId: parent })
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['topics'] })
		}
	})
}

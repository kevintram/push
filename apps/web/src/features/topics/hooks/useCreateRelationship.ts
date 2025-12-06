import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Topic } from '~/models/review-topic.types'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'
import {
	createChildRelationship,
	createParentRelationship
} from '../api/createTopicRelationship'

type CreateRelationshipInput =
	| { parent: number; child: number }
	| {
			parent: number
			childData: Pick<Topic, 'name' | 'notes' | 'archived' | 'inboxed'>
	  }
	| {
			child: number
			parentData: Pick<Topic, 'name' | 'notes' | 'archived' | 'inboxed'>
	  }

export function useCreateRelationship() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (input: CreateRelationshipInput) => {
			if ('childData' in input) {
				return createChildRelationship({
					parentId: input.parent,
					child: input.childData
				})
			}
			if ('parentData' in input) {
				return createParentRelationship({
					childId: input.child,
					parent: input.parentData
				})
			}
			return createChildRelationship({
				parentId: input.parent,
				childId: input.child
			})
		},
		onSuccess: async () => {
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

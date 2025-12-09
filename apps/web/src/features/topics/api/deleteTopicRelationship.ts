import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import type {
	DeleteChildRelationshipInput,
	DeleteParentRelationshipInput
} from '../types/api.types'
import { TopicSchema } from '../types/topic.schemas'
import type { Topic } from '../types/topic.types'
import { topicKeys } from './queryKeys'

export async function deleteChildRelationship(
	input: DeleteChildRelationshipInput
) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.parentId}/children/${input.childId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(TopicSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export async function deleteParentRelationship(
	input: DeleteParentRelationshipInput
) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.childId}/parents/${input.parentId}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(TopicSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useDeleteRelationship() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ parent, child }: { parent: number; child: number }) => {
			return deleteParentRelationship({ childId: child, parentId: parent })
		},
		onSuccess: (_, variables) => {
			const parentId = variables.parent
			const childId = variables.child

			// Remove the child from the parent's children
			queryClient.setQueryData(
				topicKeys.children(parentId),
				(old: Array<Topic>) => {
					return old.filter((topic: Topic) => topic.id !== childId)
				}
			)
			// Remove the parent from the child's parents
			queryClient.setQueryData(
				topicKeys.parents(childId),
				(old: Array<Topic>) => {
					return old.filter((topic: Topic) => topic.id !== parentId)
				}
			)
		}
	})
}

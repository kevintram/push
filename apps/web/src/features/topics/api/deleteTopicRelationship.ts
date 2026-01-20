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

export type ChildHandlingStrategy = 'delete' | 'orphan' | 'reparent'

export async function deleteChildRelationship(
	input: DeleteChildRelationshipInput & { strategy?: ChildHandlingStrategy }
) {
	const url = new URL(
		`${import.meta.env.VITE_API_URL}/topics/${input.parentId}/children/${input.childId}/`
	)
	if (input.strategy) {
		url.searchParams.set('strategy', input.strategy)
	}

	const response = await apiFetch(url.toString(), {
		method: 'DELETE'
	})

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
	// With tree structure, removing parent is done by setting parent_id to null via PATCH
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.childId}/`,
		{
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ parent_id: null })
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

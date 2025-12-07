import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { TopicSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'

type DeleteChildRelationshipInput = {
	parentId: number
	childId: number
}

type DeleteParentRelationshipInput = {
	childId: number
	parentId: number
}

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
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})
}

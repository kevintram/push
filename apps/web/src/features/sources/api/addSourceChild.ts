import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { SourceRelationshipResponseSchema } from '../types/source.schemas'
import type {
	SourceChildRelationshipCreate,
	SourceRelationshipResponse
} from '../types/source.types'
import { sourceKeys } from './queryKeys'

export type AddSourceChildInput = {
	parentId: number
	data: SourceChildRelationshipCreate
}

export async function addSourceChild(
	input: AddSourceChildInput
): Promise<SourceRelationshipResponse> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${input.parentId}/children/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(input.data)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const responseData = await response.json()
	try {
		return v.parse(SourceRelationshipResponseSchema, responseData)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useAddSourceChild() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: addSourceChild,
		onSuccess: async response => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: sourceKeys.byId(response.parent.id)
				}),
				queryClient.invalidateQueries({
					queryKey: sourceKeys.byId(response.child.id)
				})
			])
		}
	})
}

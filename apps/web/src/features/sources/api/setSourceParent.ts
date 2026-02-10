import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { SourceRelationshipResponseSchema } from '../types/source.schemas'
import type { SourceRelationshipResponse } from '../types/source.types'
import { sourceKeys } from './queryKeys'

export type SetSourceParentInput =
	| {
			sourceId: number
			parentId: number
	  }
	| {
			sourceId: number
			parent: {
				title: string
				notes: string
				archived: boolean
				inboxed: boolean
				srs_enabled?: boolean
				inherit_fsrs?: boolean
			}
	  }

export async function setSourceParent(
	input: SetSourceParentInput
): Promise<SourceRelationshipResponse> {
	const body =
		'parentId' in input
			? { parent_id: input.parentId }
			: {
					parent: {
						title: input.parent.title,
						notes: input.parent.notes,
						archived: input.parent.archived,
						inboxed: input.parent.inboxed,
						srs_enabled: input.parent.srs_enabled,
						inherit_fsrs: input.parent.inherit_fsrs
					}
				}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${input.sourceId}/parent/`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
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

export function useSetSourceParent() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: setSourceParent,
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

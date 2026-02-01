import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { sourceKeys } from '~/features/sources/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import type { AddPracticeSourceInput } from '../types/api.types'
import { PracticeSourceResponseSchema } from '../types/practice.schemas'
import type { PracticeSourceResponse } from '../types/practice.types'
import { practiceKeys } from './queryKeys'

export async function addPracticeSource(
	input: AddPracticeSourceInput
): Promise<PracticeSourceResponse> {
	const body =
		'sourceId' in input
			? { source_id: input.sourceId }
			: {
					source: {
						title: input.source.title,
						notes: input.source.notes,
						archived: input.source.archived,
						inboxed: input.source.inboxed,
						srs_enabled: input.source.srs_enabled,
						inherit_fsrs: input.source.inherit_fsrs
					}
				}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/${input.practiceId}/sources/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(PracticeSourceResponseSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useAddPracticeSource() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: addPracticeSource,
		onSuccess: async (_, input) => {
			const sourceId = 'sourceId' in input ? input.sourceId : undefined
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: practiceKeys.byId(input.practiceId)
				}),
				sourceId
					? queryClient.invalidateQueries({
							queryKey: sourceKeys.byId(sourceId)
						})
					: queryClient.invalidateQueries({
							queryKey: sourceKeys.all
						})
			])
		}
	})
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import {
	invalidateSourceDetailQueries,
	sourceKeys
} from '~/features/sources/api/queryKeys'
import { SourceTopicResponseSchema } from '~/features/sources/types/source.schemas'
import type { SourceTopicResponse } from '~/features/sources/types/source.types'
import { apiFetch } from '~/utils/apiFetch'
import { invalidateTopicDetailQueries } from './queryKeys'

type AddTopicSourceParams =
	| {
			topicId: number
			sourceId: number
	  }
	| {
			topicId: number
			source: {
				title: string
				notes: string
				archived: boolean
				inboxed: boolean
				srs_enabled?: boolean
				inherit_fsrs?: boolean
			}
	  }

async function addTopicSource(
	input: AddTopicSourceParams
): Promise<SourceTopicResponse> {
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
		`${import.meta.env.VITE_API_URL}/topics/${input.topicId}/sources/`,
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
		return v.parse(SourceTopicResponseSchema, responseData)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useAddTopicSource() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: addTopicSource,
		onSuccess: async (response, variables) => {
			const sourceId =
				'sourceId' in variables ? variables.sourceId : response.source.id
			await Promise.all([
				invalidateTopicDetailQueries(queryClient, variables.topicId),
				sourceId
					? invalidateSourceDetailQueries(queryClient, sourceId)
					: queryClient.invalidateQueries({
							queryKey: sourceKeys.all
						})
			])
		}
	})
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { SourceTopicResponseSchema } from '../types/source.schemas'
import type { SourceTopicAdd, SourceTopicResponse } from '../types/source.types'
import { sourceKeys } from './queryKeys'

export async function addSourceTopic(
	sourceId: number,
	data: SourceTopicAdd
): Promise<SourceTopicResponse> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${sourceId}/topics/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
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

export function useAddSourceTopic() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			sourceId,
			data
		}: {
			sourceId: number
			data: SourceTopicAdd
		}) => addSourceTopic(sourceId, data),
		onSuccess: async responseData => {
			const sourceId = responseData.source.id
			const topicId = responseData.topic.id

			// Invalidate source detail so the topics list refreshes
			// Also invalidate topic detail so the sources list refreshes
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: sourceKeys.byId(sourceId)
				}),
				queryClient.invalidateQueries({
					queryKey: topicKeys.byId(topicId)
				})
			])
		}
	})
}

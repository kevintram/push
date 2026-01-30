import { useMutation, useQueryClient } from '@tanstack/react-query'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { ConversionError } from '~/utils/ConversionError'
import { sourceKeys } from './queryKeys'

export type ConvertSourceToTopicInput = {
	sourceId: number
}

export type ConvertSourceToTopicResponse = {
	topic_id: number
}

export async function convertSourceToTopic(
	input: ConvertSourceToTopicInput
): Promise<ConvertSourceToTopicResponse> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${input.sourceId}/convert-to-topic/`,
		{
			method: 'POST'
		}
	)

	if (!response.ok) {
		const data = await response
			.json()
			.catch(() => ({ detail: 'Conversion failed' }))
		throw new ConversionError(
			data.detail || 'Failed to convert source to topic',
			response.status
		)
	}

	return response.json()
}

export function useConvertSourceToTopic() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: convertSourceToTopic,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sourceKeys.all })
			queryClient.invalidateQueries({ queryKey: topicKeys.all })
			queryClient.invalidateQueries({ queryKey: practiceKeys.all })
			queryClient.invalidateQueries({ queryKey: reviewKeys.all })
		}
	})
}

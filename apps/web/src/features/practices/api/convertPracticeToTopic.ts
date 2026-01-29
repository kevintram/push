import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { ConversionError } from '~/utils/ConversionError'
import { practiceKeys } from './queryKeys'

export type ConvertPracticeToTopicInput = {
	practiceId: number
}

export type ConvertPracticeToTopicResponse = {
	topic_id: number
}

export async function convertPracticeToTopic(
	input: ConvertPracticeToTopicInput
): Promise<ConvertPracticeToTopicResponse> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/${input.practiceId}/convert-to-topic/`,
		{
			method: 'POST'
		}
	)

	if (!response.ok) {
		const data = await response
			.json()
			.catch(() => ({ detail: 'Conversion failed' }))
		throw new ConversionError(
			data.detail || 'Failed to convert practice to topic',
			response.status
		)
	}

	return response.json()
}

export function useConvertPracticeToTopic() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: convertPracticeToTopic,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: practiceKeys.all })
			queryClient.invalidateQueries({ queryKey: topicKeys.all })
			queryClient.invalidateQueries({ queryKey: reviewKeys.all })
		}
	})
}

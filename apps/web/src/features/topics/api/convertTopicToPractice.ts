import { useMutation, useQueryClient } from '@tanstack/react-query'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { topicKeys } from './queryKeys'

export type ConvertTopicToPracticeInput = {
	topicId: number
}

export type ConvertTopicToPracticeResponse = {
	practice_id: number
}

export class ConversionError extends Error {
	statusCode: number

	constructor(message: string, statusCode: number) {
		super(message)
		this.name = 'ConversionError'
		this.statusCode = statusCode
	}
}

export async function convertTopicToPractice(
	input: ConvertTopicToPracticeInput
): Promise<ConvertTopicToPracticeResponse> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.topicId}/convert-to-practice/`,
		{
			method: 'POST'
		}
	)

	if (!response.ok) {
		const data = await response
			.json()
			.catch(() => ({ detail: 'Conversion failed' }))
		throw new ConversionError(
			data.detail || 'Failed to convert topic to practice',
			response.status
		)
	}

	return response.json()
}

export function useConvertTopicToPractice() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: convertTopicToPractice,
		onSuccess: () => {
			// Invalidate all affected queries
			queryClient.invalidateQueries({ queryKey: topicKeys.all })
			queryClient.invalidateQueries({ queryKey: practiceKeys.all })
			queryClient.invalidateQueries({ queryKey: reviewKeys.all })
		}
	})
}

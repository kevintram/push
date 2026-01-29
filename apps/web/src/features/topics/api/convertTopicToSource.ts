import { useMutation, useQueryClient } from '@tanstack/react-query'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { sourceKeys } from '~/features/sources/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { topicKeys } from './queryKeys'

export type ConvertTopicToSourceInput = {
	topicId: number
}

export type ConvertTopicToSourceResponse = {
	source_id: number
}

export class ConversionError extends Error {
	statusCode: number

	constructor(message: string, statusCode: number) {
		super(message)
		this.name = 'ConversionError'
		this.statusCode = statusCode
	}
}

export async function convertTopicToSource(
	input: ConvertTopicToSourceInput
): Promise<ConvertTopicToSourceResponse> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${input.topicId}/convert-to-source/`,
		{
			method: 'POST'
		}
	)

	if (!response.ok) {
		const data = await response
			.json()
			.catch(() => ({ detail: 'Conversion failed' }))
		throw new ConversionError(
			data.detail || 'Failed to convert topic to source',
			response.status
		)
	}

	return response.json()
}

export function useConvertTopicToSource() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: convertTopicToSource,
		onSuccess: () => {
			// Invalidate all affected queries
			queryClient.invalidateQueries({ queryKey: topicKeys.all })
			queryClient.invalidateQueries({ queryKey: sourceKeys.all })
			queryClient.invalidateQueries({ queryKey: practiceKeys.all })
			queryClient.invalidateQueries({ queryKey: reviewKeys.all })
		}
	})
}

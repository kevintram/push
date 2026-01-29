import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { sourceKeys } from '~/features/sources/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { ConversionError } from '~/utils/ConversionError'
import { practiceKeys } from './queryKeys'

export type ConvertPracticeToSourceInput = {
	practiceId: number
}

export type ConvertPracticeToSourceResponse = {
	source_id: number
}

export async function convertPracticeToSource(
	input: ConvertPracticeToSourceInput
): Promise<ConvertPracticeToSourceResponse> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/${input.practiceId}/convert-to-source/`,
		{
			method: 'POST'
		}
	)

	if (!response.ok) {
		const data = await response
			.json()
			.catch(() => ({ detail: 'Conversion failed' }))
		throw new ConversionError(
			data.detail || 'Failed to convert practice to source',
			response.status
		)
	}

	return response.json()
}

export function useConvertPracticeToSource() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: convertPracticeToSource,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: practiceKeys.all })
			queryClient.invalidateQueries({ queryKey: sourceKeys.all })
			queryClient.invalidateQueries({ queryKey: reviewKeys.all })
		}
	})
}

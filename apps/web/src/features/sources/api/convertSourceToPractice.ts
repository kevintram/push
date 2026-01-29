import { useMutation, useQueryClient } from '@tanstack/react-query'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import { ConversionError } from '~/utils/ConversionError'
import { sourceKeys } from './queryKeys'

export type ConvertSourceToPracticeInput = {
	sourceId: number
}

export type ConvertSourceToPracticeResponse = {
	practice_id: number
}

export async function convertSourceToPractice(
	input: ConvertSourceToPracticeInput
): Promise<ConvertSourceToPracticeResponse> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${input.sourceId}/convert-to-practice/`,
		{
			method: 'POST'
		}
	)

	if (!response.ok) {
		const data = await response
			.json()
			.catch(() => ({ detail: 'Conversion failed' }))
		throw new ConversionError(
			data.detail || 'Failed to convert source to practice',
			response.status
		)
	}

	return response.json()
}

export function useConvertSourceToPractice() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: convertSourceToPractice,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sourceKeys.all })
			queryClient.invalidateQueries({ queryKey: practiceKeys.all })
			queryClient.invalidateQueries({ queryKey: reviewKeys.all })
		}
	})
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import type { UpdatePracticeInput } from '../types/api.types'
import { PracticeSchema } from '../types/practice.schemas'
import { practiceKeys } from './queryKeys'

export async function updatePractice(input: UpdatePracticeInput) {
	const { id, ...updateData } = input
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/${id}/`,
		{
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updateData)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(PracticeSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useUpdatePractice(
	onSuccessOverride?: (
		data: v.InferOutput<typeof PracticeSchema>
	) => Promise<unknown> | unknown
) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updatePractice,
		onSuccess: async data => {
			if (onSuccessOverride) {
				await onSuccessOverride(data)
			} else {
				queryClient.invalidateQueries({
					queryKey: practiceKeys.all
				})
				queryClient.invalidateQueries({
					queryKey: reviewKeys.all
				})
			}
		}
	})
}

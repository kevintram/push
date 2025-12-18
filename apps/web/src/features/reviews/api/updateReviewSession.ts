import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import type { UpdateReviewSessionInput } from '../types/api.types'
import { ReviewSessionSchema } from '../types/review.schemas'
import type { ReviewSession } from '../types/review.types'
import { reviewSessionKeys } from './queryKeys'

export async function updateReviewSession(
	input: UpdateReviewSessionInput
): Promise<ReviewSession> {
	const { id, ...updateData } = input
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-sessions/${id}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id,
				...updateData
			})
		}
	)
	const data = await response.json()
	try {
		return v.parse(ReviewSessionSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useUpdateReviewSession() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateReviewSession,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: topicKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewSessionKeys.all })
			])
		}
	})
}

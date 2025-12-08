import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import type { UpdateReviewInput } from '../types/api.types'
import { type Review, ReviewSchema } from '../types/review.types'
import { reviewKeys } from './queryKeys'

export async function updateReview(input: UpdateReviewInput): Promise<Review> {
	const { id, ...updateData } = input
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/reviews/${id}`,
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
		return v.parse(ReviewSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useUpdateReview() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateReview,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: topicKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all })
			])
		}
	})
}

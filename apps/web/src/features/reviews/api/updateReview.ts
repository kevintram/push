import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { searchKeys } from '~/features/search/api/searchAll'
import { sourceKeys } from '~/features/sources/api/queryKeys'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import type { UpdateReviewInput } from '../types/api.types'
import { ReviewSchema } from '../types/review.schemas'
import { reviewKeys, reviewQueueKeys } from './queryKeys'

export async function updateReview(input: UpdateReviewInput) {
	const { id, ...updateData } = input
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/reviews/${id}/`,
		{
			method: 'POST',
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
				queryClient.invalidateQueries({ queryKey: sourceKeys.all }),
				queryClient.invalidateQueries({ queryKey: practiceKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewQueueKeys.all }),
				queryClient.invalidateQueries({ queryKey: searchKeys.all })
			])
		}
	})
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { reviewCardKeys } from '~/modules/review-cards/api/queryKeys'
import { searchKeys } from '~/modules/search/api/searchAll'
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

type UpdateReviewInvalidationScope = 'all' | 'reviews-only'

type UseUpdateReviewOptions = {
	invalidationScope?: UpdateReviewInvalidationScope
	onDeferredInvalidation?: () => void
}

export function useUpdateReview({
	invalidationScope = 'all',
	onDeferredInvalidation
}: UseUpdateReviewOptions = {}) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateReview,
		onSuccess: async () => {
			if (invalidationScope === 'reviews-only') {
				onDeferredInvalidation?.()
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: reviewCardKeys.all,
						refetchType: 'none'
					}),
					queryClient.invalidateQueries({
						queryKey: reviewKeys.all
					}),
					queryClient.invalidateQueries({
						queryKey: reviewQueueKeys.all,
						refetchType: 'none'
					}),
					queryClient.invalidateQueries({
						queryKey: searchKeys.all,
						refetchType: 'none'
					})
				])
				return
			}

			await Promise.all([
				queryClient.invalidateQueries({ queryKey: reviewCardKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewQueueKeys.all }),
				queryClient.invalidateQueries({ queryKey: searchKeys.all })
			])
		}
	})
}

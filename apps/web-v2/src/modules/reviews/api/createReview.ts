import { useMutation, useQueryClient } from '@tanstack/react-query'

import { mutationScopes, optimisticMutationKeys } from '~/lib/mutationConfig'
import { invalidateAfterOptimisticBatch } from '~/lib/optimisticInvalidation'
import { apiFetch } from '~/utils/apiFetch'

import { ReviewSchema } from '../types/review.schemas'
import type { Review } from '../types/review.types'
import { reviewQueries } from './queries'

export type CreateReviewInput = {
	reviewCardId: string
}

export async function createReview({
	reviewCardId,
}: CreateReviewInput): Promise<Review> {
	return apiFetch(ReviewSchema, `/review-cards/${reviewCardId}/reviews/`, {
		method: 'POST',
		body: {},
	})
}

export function useCreateReview() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: [...optimisticMutationKeys.reviews, 'create'],
		scope: mutationScopes.reviews,
		mutationFn: createReview,
		meta: { errorMessage: 'Failed to create review' },
		onSuccess: (review, { reviewCardId }) => {
			for (const [queryKey, reviews] of queryClient.getQueriesData<
				Array<Review>
			>({ queryKey: reviewQueries.forCard(reviewCardId) })) {
				if (!reviews) continue
				const filters = queryKey.at(-1)
				const nextReviews =
					typeof filters === 'object' &&
					filters !== null &&
					'order' in filters &&
					filters.order === 'asc'
						? [...reviews, review]
						: [review, ...reviews]
				queryClient.setQueryData(queryKey, nextReviews)
			}
		},
		onSettled: (_data, _error, { reviewCardId }) =>
			invalidateAfterOptimisticBatch(queryClient, [
				reviewQueries.forCard(reviewCardId),
			]),
	})
}

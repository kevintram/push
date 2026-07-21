import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

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
	const url = new URL(
		import.meta.env.VITE_API_URL + `/review-cards/${reviewCardId}/reviews/`,
	)
	const response = await apiFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	})
	if (!response.ok) {
		throw new Error(`Failed to create review: ${response.status}`)
	}
	return v.parse(ReviewSchema, await response.json())
}

export function useCreateReview() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: createReview,
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
	})
}

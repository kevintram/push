import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import type { DateString } from '~/types/date'
import { apiFetch } from '~/utils/apiFetch'

import { ReviewSchema } from '../types/review.schemas'
import type { Rating, Review } from '../types/review.types'
import { reviewCardQueries, reviewQueries } from './queries'

export type UpdateReviewInput = {
	id: string
	rating?: Rating | null
	description?: string
	notes?: string
	scheduled_at?: DateString | null
	completed_at?: DateString | null
}

export async function updateReview({
	id,
	...updates
}: UpdateReviewInput): Promise<Review> {
	const url = new URL(import.meta.env.VITE_API_URL + `/reviews/${id}/`)
	const response = await apiFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updates),
	})
	if (!response.ok) {
		throw new Error(`Failed to update review ${id}: ${response.status}`)
	}
	return v.parse(ReviewSchema, await response.json())
}

export function useUpdateReview() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: updateReview,
		onSuccess: async (review, updates) => {
			if (
				'scheduled_at' in updates ||
				'completed_at' in updates ||
				'rating' in updates
			) {
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: reviewQueries.forCard(review.review_card_id),
					}),
					queryClient.invalidateQueries({
						queryKey: reviewCardQueries.all,
					}),
				])
				return
			}

			queryClient.setQueriesData<Array<Review>>(
				{ queryKey: reviewQueries.all },
				reviews =>
					reviews?.map(existing =>
						existing.id === review.id ? review : existing,
					),
			)
		},
	})
}

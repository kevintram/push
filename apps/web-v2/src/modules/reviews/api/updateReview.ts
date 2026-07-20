import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { ReviewSchema } from '../types/review.schemas'
import type { Rating, Review } from '../types/review.types'
import { reviewQueries } from './queries'

export type UpdateReviewInput = {
	id: number | string
	rating?: Rating | null
	description?: string
	notes?: string
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
		onSuccess: review => {
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

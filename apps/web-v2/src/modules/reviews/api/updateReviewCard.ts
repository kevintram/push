import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { ReviewCardSchema } from '../types/review.schemas'
import type { ReviewCard } from '../types/review.types'
import { reviewCardQueries } from './queries'

export type UpdateReviewCardInput = {
	id: string
	primary_text?: string
	secondary_text?: string
	notes?: string
}

export async function updateReviewCard({
	id,
	...updates
}: UpdateReviewCardInput): Promise<ReviewCard> {
	const url = new URL(import.meta.env.VITE_API_URL + `/review-cards/${id}/`)
	const response = await apiFetch(url, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updates),
	})
	if (!response.ok) {
		throw new Error(
			`Failed to update review card ${id}: ${response.status}`,
		)
	}
	return v.parse(ReviewCardSchema, await response.json())
}

export function useUpdateReviewCard() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: updateReviewCard,
		onSuccess: reviewCard => {
			queryClient.setQueryData(
				reviewCardQueries.detail(reviewCard.id).queryKey,
				reviewCard,
			)
			void queryClient.invalidateQueries({
				queryKey: reviewCardQueries.lists(),
			})
		},
	})
}

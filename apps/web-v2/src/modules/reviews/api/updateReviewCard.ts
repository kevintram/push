import { useMutation, useQueryClient } from '@tanstack/react-query'

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
	return apiFetch(ReviewCardSchema, `/review-cards/${id}/`, {
		method: 'PATCH',
		body: updates,
	})
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

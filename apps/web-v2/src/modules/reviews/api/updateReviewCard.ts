import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from '~/utils/apiFetch'

import { ReviewCardSchema } from '../types/review.schemas'
import type { ReviewCard } from '../types/review.types'
import { reviewCardQueries } from './queries'

export type UpdateReviewCardInput = {
	id: string
	type?: 'practice' | 'flashcard'
	primary_text?: string
	secondary_text?: string
	notes?: string
	flagged?: boolean
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
		meta: { errorMessage: 'Failed to update review card' },
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

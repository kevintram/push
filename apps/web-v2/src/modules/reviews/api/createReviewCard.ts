import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from '~/utils/apiFetch'

import { ReviewCardSchema } from '../types/review.schemas'
import type { ReviewCard } from '../types/review.types'
import { reviewCardQueries } from './queries'

export type CreateReviewCardInput = {
	topicId: string
	type?: 'practice' | 'flashcard'
}

export async function createReviewCard({
	topicId,
	type = 'practice',
}: CreateReviewCardInput): Promise<ReviewCard> {
	return apiFetch(ReviewCardSchema, '/review-cards/', {
		method: 'POST',
		body: { topic_id: Number(topicId), type },
	})
}

export function useCreateReviewCard() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: createReviewCard,
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

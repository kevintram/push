import { useMutation, useQueryClient } from '@tanstack/react-query'

import { mutationScopes, optimisticMutationKeys } from '~/lib/mutationConfig'
import { invalidateAfterOptimisticBatch } from '~/lib/optimisticInvalidation'
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
		mutationKey: [...optimisticMutationKeys.reviewCards, 'create'],
		scope: mutationScopes.reviewCards,
		mutationFn: createReviewCard,
		meta: { errorMessage: 'Failed to create review card' },
		onSuccess: reviewCard => {
			queryClient.setQueryData(
				reviewCardQueries.detail(reviewCard.id).queryKey,
				reviewCard,
			)
		},
		onSettled: () =>
			invalidateAfterOptimisticBatch(queryClient, [
				reviewCardQueries.lists(),
			]),
	})
}

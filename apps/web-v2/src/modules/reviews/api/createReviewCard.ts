import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import { ReviewCardSchema } from '../types/review.schemas'
import type { ReviewCard } from '../types/review.types'
import { reviewCardQueries } from './queries'

export type CreateReviewCardInput = {
	topicId: number | string
	type?: 'practice' | 'flashcard'
}

export async function createReviewCard({
	topicId,
	type = 'practice',
}: CreateReviewCardInput): Promise<ReviewCard> {
	const url = new URL(import.meta.env.VITE_API_URL + '/review-cards/')
	const response = await fetch(url, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ topic_id: Number(topicId), type }),
	})
	if (!response.ok) {
		throw new Error(`Failed to create review card: ${response.status}`)
	}
	return v.parse(ReviewCardSchema, await response.json())
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

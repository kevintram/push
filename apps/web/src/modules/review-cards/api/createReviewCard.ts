import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { ReviewCardSchema } from '../types/review-card.schemas'
import {
	type CreateReviewCardPayload,
	type ReviewCard,
} from '../types/review-card.types'
import { reviewCardKeys } from './queryKeys'

async function createReviewCard(
	payload: CreateReviewCardPayload,
): Promise<ReviewCard> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-cards/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		},
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(ReviewCardSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useCreateReviewCard() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: createReviewCard,
		onSuccess: reviewCard => {
			queryClient.setQueryData(
				reviewCardKeys.detail(reviewCard.id),
				reviewCard,
			)
			return queryClient.invalidateQueries({
				queryKey: reviewCardKeys.all,
			})
		},
	})
}

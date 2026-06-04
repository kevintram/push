import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { searchKeys } from '~/modules/search/api/searchAll'
import { apiFetch } from '~/utils/apiFetch'
import { ReviewCardSchema } from '../types/review-card.schemas'
import type {
	ReviewCard,
	UpdateReviewCardInput
} from '../types/review-card.types'
import { reviewCardKeys } from './queryKeys'

async function updateReviewCard(
	input: UpdateReviewCardInput
): Promise<ReviewCard> {
	const { id, ...payload } = input

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-cards/${id}/`,
		{
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		}
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

export function useUpdateReviewCard() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateReviewCard,
		onSuccess: async reviewCard => {
			queryClient.setQueryData(reviewCardKeys.detail(reviewCard.id), reviewCard)
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: reviewCardKeys.all }),
				queryClient.invalidateQueries({ queryKey: searchKeys.all })
			])
		}
	})
}

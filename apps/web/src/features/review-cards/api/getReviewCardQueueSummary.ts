import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { ReviewCardQueueSummarySchema } from '../types/review-card.schemas'
import type {
	ReviewCardQueueSummary,
	ReviewCardType
} from '../types/review-card.types'
import { reviewCardKeys } from './queryKeys'

export async function getReviewCardQueueSummary(
	type: ReviewCardType
): Promise<ReviewCardQueueSummary> {
	const searchParams = new URLSearchParams()
	searchParams.append('type', type)

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-cards/queue-summary/?${searchParams.toString()}`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(ReviewCardQueueSummarySchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useReviewCardQueueSummary(type: ReviewCardType) {
	return useQuery({
		queryKey: reviewCardKeys.queueSummary(type),
		queryFn: () => getReviewCardQueueSummary(type)
	})
}

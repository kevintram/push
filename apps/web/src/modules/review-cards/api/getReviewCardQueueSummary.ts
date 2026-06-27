import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { ReviewCardQueueSummarySchema } from '../types/review-card.schemas'
import {
	type ReviewCardQueueSummary,
	type ReviewCardQueueSummaryParams,
} from '../types/review-card.types'
import { reviewCardKeys } from './queryKeys'

export async function getReviewCardQueueSummary(
	params: ReviewCardQueueSummaryParams,
): Promise<ReviewCardQueueSummary> {
	const searchParams = new URLSearchParams()
	if (params.filter === undefined) {
		searchParams.append('type', params.type)
	} else {
		searchParams.append('filter', params.filter)
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-cards/queue-summary/?${searchParams.toString()}`,
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

export function useReviewCardQueueSummary(
	params: ReviewCardQueueSummaryParams,
) {
	return useQuery({
		queryKey: reviewCardKeys.queueSummary(params),
		queryFn: () => getReviewCardQueueSummary(params),
		staleTime: 30_000,
	})
}

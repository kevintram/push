import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { ReviewCardPinnedSummarySchema } from '../types/review-card.schemas'
import type { ReviewCardPinnedSummary } from '../types/review-card.types'
import { reviewCardKeys } from './queryKeys'

export async function getReviewCardPinnedSummary(): Promise<ReviewCardPinnedSummary> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-cards/pinned-summary/`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(ReviewCardPinnedSummarySchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useReviewCardPinnedSummary() {
	return useQuery({
		queryKey: reviewCardKeys.pinnedSummary(),
		queryFn: getReviewCardPinnedSummary
	})
}

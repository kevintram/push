import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { ReviewCardFlaggedSummarySchema } from '../types/review-card.schemas'
import type { ReviewCardFlaggedSummary } from '../types/review-card.types'
import { reviewCardKeys } from './queryKeys'

export async function getReviewCardFlaggedSummary(): Promise<ReviewCardFlaggedSummary> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-cards/flagged-summary/`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(ReviewCardFlaggedSummarySchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useReviewCardFlaggedSummary() {
	return useQuery({
		queryKey: reviewCardKeys.flaggedSummary(),
		queryFn: getReviewCardFlaggedSummary
	})
}

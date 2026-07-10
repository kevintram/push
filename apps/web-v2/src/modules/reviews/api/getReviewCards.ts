import * as v from 'valibot'

import { ReviewCardSchema } from '../types/review.schemas'
import type { ReviewCard, ReviewCardFilters } from '../types/review.types'
import { reviewCardKeys } from './queryKeys'

const fetchReviewCards = async (
	filters?: ReviewCardFilters,
): Promise<Array<ReviewCard>> => {
	const url = new URL(import.meta.env.VITE_API_URL + '/review-cards/')
	if (filters !== undefined) {
		url.search = new URLSearchParams(filters).toString()
	}

	const response = await fetch(url, { credentials: 'include' })

	if (!response.ok) {
		throw new Error(`Failed to fetch new reviews: ${response.status}`)
	}

	const data = await response.json()
	return v.parse(v.array(ReviewCardSchema), data)
}

export const getReviewCardsParams = (filters?: ReviewCardFilters) => {
	return {
		queryKey: reviewCardKeys.list(filters),
		queryFn: () => fetchReviewCards(filters),
	}
}

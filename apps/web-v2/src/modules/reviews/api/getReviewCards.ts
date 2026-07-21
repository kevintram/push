import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { ReviewCardSchema } from '../types/review.schemas'
import type { ReviewCard, ReviewCardFilters } from '../types/review.types'

export async function fetchReviewCards(
	filters?: ReviewCardFilters,
): Promise<Array<ReviewCard>> {
	const url = new URL(import.meta.env.VITE_API_URL + '/review-cards/')
	if (filters !== undefined) {
		if (filters.due !== undefined) {
			url.searchParams.set('due', filters.due)
		}
		if (filters.topicId !== undefined) {
			url.searchParams.set('topic_id', filters.topicId)
		}
	}

	const response = await apiFetch(url)

	if (!response.ok) {
		throw new Error(`Failed to fetch reviews: ${response.status}`)
	}

	const data = await response.json()
	return v.parse(v.array(ReviewCardSchema), data)
}

export async function fetchReviewCard(
	reviewCardId: string,
): Promise<ReviewCard> {
	const url = new URL(
		import.meta.env.VITE_API_URL + `/review-cards/${reviewCardId}/`,
	)
	const response = await apiFetch(url)

	if (!response.ok) {
		throw new Error(
			`Failed to fetch review card ${reviewCardId}: ${response.status}`,
		)
	}

	const data = await response.json()
	return v.parse(ReviewCardSchema, data)
}

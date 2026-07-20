import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { ReviewSchema } from '../types/review.schemas'
import type { Review, ReviewFilters } from '../types/review.types'

export async function fetchReviews({
	reviewCardId,
	order = 'desc',
}: ReviewFilters): Promise<Array<Review>> {
	const url = new URL(import.meta.env.VITE_API_URL + '/reviews/')
	url.search = new URLSearchParams({
		review_card_id: String(reviewCardId),
		order,
	}).toString()

	const response = await apiFetch(url)

	if (!response.ok) {
		throw new Error(`Failed to fetch reviews: ${response.status}`)
	}

	return v.parse(v.array(ReviewSchema), await response.json())
}

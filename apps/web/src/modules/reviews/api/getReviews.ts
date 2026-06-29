import { queryOptions, useQuery } from '@tanstack/react-query'
import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { type GetReviewsFilters } from '../types/api.types'
import { ReviewListItemSchema, ReviewSchema } from '../types/review.schemas'
import { type Review } from '../types/review.types'
import { reviewKeys } from './queryKeys'

export const REVIEW_LIST_QUERY_STALE_TIME = 30_000
const REVIEW_DETAIL_QUERY_STALE_TIME = 30_000

export async function getReviews(filters?: GetReviewsFilters) {
	const params = new URLSearchParams()

	if (filters?.reviewCardId !== undefined) {
		params.append('review_card_id', filters.reviewCardId.toString())
	}

	if (filters?.effectiveDateBefore !== undefined) {
		params.append('effective_date_before', filters.effectiveDateBefore)
	}

	if (filters?.effectiveDateAfter !== undefined) {
		params.append('effective_date_after', filters.effectiveDateAfter)
	}

	if (filters?.scheduled !== undefined) {
		params.append('scheduled', String(filters.scheduled))
	}

	if (filters?.completed !== undefined) {
		params.append('completed', String(filters.completed))
	}

	if (filters?.order !== undefined) {
		params.append('order', filters.order)
	}

	const url = `${import.meta.env.VITE_API_URL}/reviews/${params.toString() ? `?${params.toString()}` : ''}`

	const response = await apiFetch(url, {
		method: 'GET',
	})

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(ReviewListItemSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useReviews(filters?: GetReviewsFilters) {
	return useQuery({
		...reviewsQueryOptions(filters),
	})
}

export function useReviewsByReviewCard(reviewCardId: number | undefined) {
	return useQuery({
		...reviewsQueryOptions({ reviewCardId }),
		enabled: reviewCardId !== undefined,
	})
}

export function reviewsQueryOptions(filters?: GetReviewsFilters) {
	return queryOptions({
		queryKey: reviewKeys.list(filters),
		queryFn: () => getReviews(filters),
		staleTime: REVIEW_LIST_QUERY_STALE_TIME,
	})
}

export async function getReview(reviewId: number): Promise<Review> {
	const url = `${import.meta.env.VITE_API_URL}/reviews/${reviewId}/`

	const response = await apiFetch(url, {
		method: 'GET',
	})

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(ReviewSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function reviewDetailQueryOptions(reviewId: number) {
	return queryOptions({
		queryKey: reviewKeys.detail(reviewId),
		queryFn: () => getReview(reviewId),
		staleTime: REVIEW_DETAIL_QUERY_STALE_TIME,
	})
}

export function useReview(reviewId: number | undefined) {
	return useQuery({
		...(reviewId === undefined
			? reviewDetailQueryOptions(-1)
			: reviewDetailQueryOptions(reviewId)),
		enabled: reviewId !== undefined,
	})
}

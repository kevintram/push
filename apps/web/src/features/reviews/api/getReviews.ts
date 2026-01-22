import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import type { GetReviewsFilters } from '../types/api.types'
import { ReviewListItemSchema, ReviewSchema } from '../types/review.schemas'
import { reviewKeys } from './queryKeys'

export async function getReviews(filters?: GetReviewsFilters) {
	const params = new URLSearchParams()

	if (filters?.reviewSessionId !== undefined) {
		params.append('review_session_id', filters.reviewSessionId.toString())
	}

	if (filters?.topicId !== undefined) {
		params.append('topic_id', filters.topicId.toString())
	}

	if (filters?.sourceId !== undefined) {
		params.append('source_id', filters.sourceId.toString())
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

	const url = `${import.meta.env.VITE_API_URL}/reviews/${params.toString() ? `?${params.toString()}` : ''}`

	const response = await apiFetch(url, {
		method: 'GET'
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
		queryKey: reviewKeys.list(filters),
		queryFn: () => getReviews(filters)
	})
}

export function useReviewsByTopic(topicId: number | undefined) {
	return useQuery({
		queryKey: reviewKeys.list({ topicId }),
		queryFn: () => getReviews({ topicId }),
		enabled: topicId !== undefined
	})
}

export function useReviewsBySource(sourceId: number | undefined) {
	return useQuery({
		queryKey: reviewKeys.list({ sourceId }),
		queryFn: () => getReviews({ sourceId }),
		enabled: sourceId !== undefined
	})
}

export function useReview(reviewId: number | undefined) {
	return useQuery({
		queryKey: reviewKeys.detail(reviewId!),
		queryFn: async () => {
			const url = `${import.meta.env.VITE_API_URL}/reviews/${reviewId}/`

			const response = await apiFetch(url, {
				method: 'GET'
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
		},
		enabled: reviewId !== undefined
	})
}

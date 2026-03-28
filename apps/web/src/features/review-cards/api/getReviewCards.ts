import { queryOptions, useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { ReviewCardSchema } from '../types/review-card.schemas'
import type {
	GetReviewCardsParams,
	ReviewCard
} from '../types/review-card.types'
import { reviewCardKeys } from './queryKeys'

const REVIEW_CARDS_QUERY_STALE_TIME = 30_000

export async function getReviewCards(
	params: GetReviewCardsParams = {}
): Promise<Array<ReviewCard>> {
	const searchParams = new URLSearchParams()

	if (params.topic_id !== undefined) {
		searchParams.append('topic_id', String(params.topic_id))
	}
	if (params.include_descendants !== undefined) {
		searchParams.append(
			'include_descendants',
			String(params.include_descendants)
		)
	}
	if (params.type !== undefined) {
		searchParams.append('type', params.type)
	}
	if (params.new_only !== undefined) {
		searchParams.append('new_only', String(params.new_only))
	}
	if (params.flagged_only !== undefined) {
		searchParams.append('flagged_only', String(params.flagged_only))
	}
	if (params.order !== undefined) {
		searchParams.append('order', params.order)
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-cards/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(ReviewCardSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function reviewCardsQueryOptions(params: GetReviewCardsParams = {}) {
	return queryOptions({
		queryKey: reviewCardKeys.list(params),
		queryFn: () => getReviewCards(params),
		staleTime: REVIEW_CARDS_QUERY_STALE_TIME
	})
}

export function useReviewCards(
	params: GetReviewCardsParams = {},
	options?: { enabled?: boolean }
) {
	return useQuery({
		...reviewCardsQueryOptions(params),
		enabled: options?.enabled ?? true
	})
}

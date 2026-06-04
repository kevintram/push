import { queryOptions, useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { HttpStatusError } from '~/utils/httpStatusError'
import { ReviewCardSchema } from '../types/review-card.schemas'
import type { ReviewCard } from '../types/review-card.types'
import { reviewCardKeys } from './queryKeys'

export async function getReviewCard(reviewCardId: number): Promise<ReviewCard> {
	const url = `${import.meta.env.VITE_API_URL}/review-cards/${reviewCardId}/`
	const response = await apiFetch(url)

	if (!response.ok) {
		throw new HttpStatusError(response.status, url, response.statusText)
	}

	const data = await response.json()
	try {
		return v.parse(ReviewCardSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function reviewCardQueryOptions(reviewCardId: number) {
	return queryOptions({
		queryKey: reviewCardKeys.detail(reviewCardId),
		queryFn: () => getReviewCard(reviewCardId)
	})
}

export function useReviewCard(reviewCardId: number | null) {
	return useQuery({
		...(reviewCardId === null
			? reviewCardQueryOptions(-1)
			: reviewCardQueryOptions(reviewCardId)),
		enabled: reviewCardId !== null
	})
}

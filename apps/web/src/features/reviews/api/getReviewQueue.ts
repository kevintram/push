import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { ReviewQueueItemSchema } from '../types/review-queue.schemas'
import type { ReviewQueueItem } from '../types/review-queue.types'
import { reviewQueueKeys } from './queryKeys'

export async function getReviewQueue(
	limit?: number
): Promise<Array<ReviewQueueItem>> {
	const searchParams = new URLSearchParams()
	if (limit !== undefined) {
		searchParams.append('limit', String(limit))
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-queue/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(ReviewQueueItemSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useReviewQueue(limit?: number) {
	return useQuery({
		queryKey: reviewQueueKeys.list(limit),
		queryFn: () => getReviewQueue(limit)
	})
}

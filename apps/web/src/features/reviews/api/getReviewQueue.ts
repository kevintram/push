import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import {
	ReviewQueueItemSchema,
	ReviewQueuePageSchema
} from '../types/review-queue.schemas'
import type {
	ReviewQueueItem,
	ReviewQueuePage
} from '../types/review-queue.types'
import { reviewQueueKeys } from './queryKeys'

export async function getReviewQueuePage(): Promise<ReviewQueuePage> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-queue/`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(ReviewQueuePageSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export async function getReviewQueue(): Promise<Array<ReviewQueueItem>> {
	const page = await getReviewQueuePage()
	return v.parse(v.array(ReviewQueueItemSchema), page.items)
}

export function useReviewQueue() {
	return useQuery({
		queryKey: reviewQueueKeys.list(),
		queryFn: () => getReviewQueue()
	})
}

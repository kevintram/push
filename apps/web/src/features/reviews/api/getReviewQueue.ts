import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
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

type GetReviewQueuePageParams = {
	limit?: number
	cursor?: string
}

const DEFAULT_REVIEW_QUEUE_PAGE_SIZE = 50

export async function getReviewQueuePage({
	limit,
	cursor
}: GetReviewQueuePageParams = {}): Promise<ReviewQueuePage> {
	const searchParams = new URLSearchParams()
	if (limit !== undefined) {
		searchParams.append('limit', String(limit))
	}
	if (cursor !== undefined) {
		searchParams.append('cursor', cursor)
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-queue/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
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

export async function getReviewQueue(
	limit?: number
): Promise<Array<ReviewQueueItem>> {
	const page = await getReviewQueuePage({ limit })
	return v.parse(v.array(ReviewQueueItemSchema), page.items)
}

export function useReviewQueue(limit?: number) {
	return useQuery({
		queryKey: reviewQueueKeys.list(limit),
		queryFn: () => getReviewQueue(limit)
	})
}

export function useInfiniteReviewQueue(
	limit: number = DEFAULT_REVIEW_QUEUE_PAGE_SIZE
) {
	return useInfiniteQuery({
		queryKey: reviewQueueKeys.infinite(limit),
		initialPageParam: undefined as string | undefined,
		queryFn: ({ pageParam }) =>
			getReviewQueuePage({
				limit,
				cursor: typeof pageParam === 'string' ? pageParam : undefined
			}),
		getNextPageParam: lastPage => lastPage.next_cursor ?? undefined
	})
}

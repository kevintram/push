import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { ReviewCardQueuePageSchema } from '../types/review-card.schemas'
import {
	type ReviewCardQueueItem,
	type ReviewCardQueuePage,
	type ReviewCardQueueParams,
} from '../types/review-card.types'
import { reviewCardKeys } from './queryKeys'

export async function getReviewCardQueuePage(
	params: ReviewCardQueueParams,
): Promise<ReviewCardQueuePage> {
	const searchParams = new URLSearchParams()
	if (params.filter === undefined) {
		searchParams.append('type', params.type)
	} else {
		searchParams.append('filter', params.filter)
	}

	if (params.mode !== undefined) {
		searchParams.append('mode', params.mode)
	}
	if (params.include_future !== undefined) {
		searchParams.append('include_future', String(params.include_future))
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-cards/queue/?${searchParams.toString()}`,
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(ReviewCardQueuePageSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export async function getReviewCardQueue(
	params: ReviewCardQueueParams,
): Promise<Array<ReviewCardQueueItem>> {
	const page = await getReviewCardQueuePage(params)
	return page.items
}

export function useReviewCardQueuePage(params: ReviewCardQueueParams) {
	return useQuery({
		queryKey: reviewCardKeys.queue(params),
		queryFn: () => getReviewCardQueuePage(params),
	})
}

export function useReviewCardQueue(params: ReviewCardQueueParams) {
	return useQuery({
		queryKey: reviewCardKeys.queue(params),
		queryFn: () => getReviewCardQueue(params),
	})
}

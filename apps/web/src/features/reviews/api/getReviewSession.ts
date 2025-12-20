import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { ReviewSessionSchema } from '../types/review.schemas'
import { reviewSessionKeys } from './queryKeys'

export async function getReviewSession(reviewSessionId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-sessions/${reviewSessionId}/`,
		{
			method: 'GET'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(ReviewSessionSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useReviewSessionWithReviews(reviewSessionId: number) {
	const { data: reviewSession, isLoading } = useQuery({
		queryKey: reviewSessionKeys.detail(reviewSessionId),
		queryFn: () => getReviewSession(reviewSessionId),
		enabled: !!reviewSessionId
	})

	return {
		reviewSession,
		isLoading
	}
}

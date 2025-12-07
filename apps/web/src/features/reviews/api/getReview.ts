import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { ReviewSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

export async function getReview(reviewId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/reviews/${reviewId}/`,
		{
			method: 'GET'
		}
	)

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

export function useReviewWithTopics(reviewId: number) {
	const { data: review, isLoading } = useQuery({
		queryKey: ['reviews', reviewId],
		queryFn: () => getReview(reviewId),
		enabled: !!reviewId
	})

	return {
		review,
		isLoading
	}
}

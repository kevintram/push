import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import type { Rating } from '~/models/review-topic.types'
import { TopicReviewSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'

export async function updateTopicReview(id: number, rating: Rating) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topic-reviews/${id}/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ rating })
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(TopicReviewSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useUpdateTopicReview() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, rating }: { id: number; rating: Rating }) =>
			updateTopicReview(id, rating),
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})
}

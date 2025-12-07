import * as v from 'valibot'
import type { Rating } from '~/models/review-topic.types'
import { TopicReviewSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

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

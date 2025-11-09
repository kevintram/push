import * as v from 'valibot'
import type { Rating } from '~/models/todo-topic.types'
import { ReviewSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

export async function updateReview(reviewId: number, rating: Rating) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/reviews/${reviewId}/`,
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
		return v.parse(ReviewSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

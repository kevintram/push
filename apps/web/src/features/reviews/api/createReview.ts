import * as v from 'valibot'
import { type Rating, ReviewSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

export async function createReview(
	todoId: number,
	topicId: number,
	rating: Rating = 'good'
) {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/reviews/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			todo_id: todoId,
			topic_id: topicId,
			rating
		})
	})

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

import * as v from 'valibot'
import { type Review, ReviewSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

export type UpdateReviewInput = {
	id: number
	description?: string
	notes?: string
	scheduled_at?: string | null
	completed_at?: string | null
}

export async function updateReview(input: UpdateReviewInput): Promise<Review> {
	const { id, ...updateData } = input
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/reviews/${id}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id,
				...updateData
			})
		}
	)
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

import * as v from 'valibot'
import { ReviewSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

type GetReviewsFilters = {
	topicId?: number
}

export async function getReviews(filters?: GetReviewsFilters) {
	const params = new URLSearchParams()

	if (filters?.topicId !== undefined) {
		params.append('topic_id', filters.topicId.toString())
	}

	const url = `${import.meta.env.VITE_API_URL}/reviews/${params.toString() ? `?${params.toString()}` : ''}`

	const response = await apiFetch(url, {
		method: 'GET'
	})

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(ReviewSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

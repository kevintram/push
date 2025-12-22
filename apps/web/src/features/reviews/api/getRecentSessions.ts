import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { ReviewSessionSchema } from '../types/review.schemas'
import { reviewSessionKeys } from './queryKeys'

export async function getRecentSessions(limit = 10) {
	const url = `${import.meta.env.VITE_API_URL}/review-sessions/recent/?limit=${limit}`

	const response = await apiFetch(url, {
		method: 'GET'
	})

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(ReviewSessionSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useRecentSessions(limit = 10) {
	return useQuery({
		queryKey: reviewSessionKeys.recent(limit),
		queryFn: () => getRecentSessions(limit)
	})
}

import * as v from 'valibot'
import type { Topic } from '~/types/topics.types'
import { apiFetch } from '~/utils/apiFetch'
import { TopicSchema } from './schemas'

const TopicSearchResponseSchema = v.array(TopicSchema)

export type SearchTopicsParams = {
	query?: string
	limit?: number
}

export async function searchTopics(
	params: SearchTopicsParams = {}
): Promise<Array<Topic>> {
	const searchParams = new URLSearchParams()

	const trimmedQuery = params.query?.trim()
	if (trimmedQuery) {
		searchParams.set('query', trimmedQuery)
	}

	if (typeof params.limit === 'number') {
		searchParams.set('limit', String(params.limit))
	}

	const url = `${import.meta.env.VITE_API_URL}/topics/search/${
		searchParams.size > 0 ? `?${searchParams.toString()}` : ''
	}`

	const response = await apiFetch(url)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	return v.parse(TopicSearchResponseSchema, data)
}

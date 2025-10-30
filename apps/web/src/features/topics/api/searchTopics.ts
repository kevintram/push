import * as v from 'valibot'
import { type Topic, TopicSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

const TopicSearchResponseSchema = v.array(TopicSchema)

export type SearchTopicsParams = {
	query?: string
	limit?: number
	addableToTodo?: number
	addableAsParentTo?: number
	addableAsChildTo?: number
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

	if (typeof params.addableToTodo === 'number') {
		searchParams.set('addable_to_todo', String(params.addableToTodo))
	}

	if (typeof params.addableAsParentTo === 'number') {
		searchParams.set('addable_as_parent_to', String(params.addableAsParentTo))
	}

	if (typeof params.addableAsChildTo === 'number') {
		searchParams.set('addable_as_child_to', String(params.addableAsChildTo))
	}

	const url = `${import.meta.env.VITE_API_URL}/topics/search/${
		searchParams.size > 0 ? `?${searchParams.toString()}` : ''
	}`

	const response = await apiFetch(url)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		const parsed = v.parse(TopicSearchResponseSchema, data)
		return parsed
	} catch (_error) {
		return []
	}
}

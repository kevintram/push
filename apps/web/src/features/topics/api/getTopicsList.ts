import * as v from 'valibot'
import { type Topic, TopicSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

export type GetTopicsListParams = {
	root?: boolean
	inboxed?: boolean
	archived?: boolean
}

export async function getTopicsList(
	params: GetTopicsListParams = {}
): Promise<Array<Topic>> {
	const searchParams = new URLSearchParams()

	if (params.root !== undefined) {
		searchParams.append('root', String(params.root))
	}

	if (params.inboxed !== undefined) {
		searchParams.append('inboxed', String(params.inboxed))
	}

	if (params.archived !== undefined) {
		searchParams.append('archived', String(params.archived))
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(TopicSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

import * as v from 'valibot'
import { TopicSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

type GetTopicsParams = {
	topicIds: Array<number>
}

async function getTopics(params: GetTopicsParams) {
	// For now, fetch topics individually since we don't have a batch endpoint
	// In the future, we could add a batch endpoint to the API
	const topics = await Promise.all(
		params.topicIds.map(async id => {
			const response = await apiFetch(
				`${import.meta.env.VITE_API_URL}/topics/${id}/`
			)

			if (!response.ok) {
				throw new Error(`API request failed: ${response.status}`)
			}

			const data = await response.json()
			return v.parse(TopicSchema, data)
		})
	)

	return topics
}

export { getTopics }

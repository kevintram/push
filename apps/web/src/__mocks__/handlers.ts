import { delay, HttpResponse, http } from 'msw'
import type { Topic } from '~/models/review-topic.types'
import fruits from './data/fruits.json' with { type: 'json' }
import topicsData from './data/topics.json' with { type: 'json' }

const topics = topicsData as Array<Topic>

// Helper function to find a topic by ID in the nested structure
function findTopicById(
	topicId: number,
	topicList: Array<Topic> = topics
): Topic | null {
	for (const topic of topicList) {
		if (topic.id === topicId) {
			return topic
		}
		if (topic.children && topic.children.length > 0) {
			const found = findTopicById(topicId, topic.children)
			if (found) return found
		}
	}
	return null
}

export const handlers = [
	http.get('/fruits', async () => {
		await delay('real')
		return HttpResponse.json(fruits)
	}),

	// Mock endpoint for getting a single topic with relationships
	http.get('http://localhost:8000/topics/:topicId/', async ({ params }) => {
		await delay('real')
		const topicId = Number(params.topicId)

		if (Number.isNaN(topicId)) {
			return new HttpResponse(null, { status: 400 })
		}

		const topic = findTopicById(topicId)

		if (!topic) {
			return new HttpResponse(null, { status: 404 })
		}

		return HttpResponse.json(topic)
	})
]

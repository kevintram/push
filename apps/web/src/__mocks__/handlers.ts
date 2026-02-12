import { delay, HttpResponse, http } from 'msw'
import type { Topic } from '~/features/topics/types/topic.types'
import fruits from './data/fruits.json' with { type: 'json' }
import topicsData from './data/topics.json' with { type: 'json' }

// Mock topics data - type assertion bypassed as the JSON structure may not match
// the full Topic type (this is expected for mock data)
const topics = topicsData as unknown as Array<Topic>

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
	}),

	// Mock endpoint for getting related topics
	http.get(
		'http://localhost:8000/topics/:topicId/related/',
		async ({ params }) => {
			await delay('real')
			const topicId = Number(params.topicId)

			if (Number.isNaN(topicId)) {
				return new HttpResponse(null, { status: 400 })
			}

			// For demonstration, let's return a couple of hardcoded related topics
			// In a real scenario, you might want more dynamic related topic generation
			const mockRelatedTopics: Array<Topic> = [
				{
					id: 999,
					name: 'Mock Related Topic 1',
					notes: 'This is a mock related topic.',
					inserted_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					parent_id: null,
					fsrs_state_id: null,
					stability: null,
					inherited_stability: null,
					inherited_difficulty: null,
					inherited_state: null,
					inherited_step: null,
					inherited_last_review: null,
					difficulty: null,
					state: 'LEARNING',
					step: null,
					archived: false,
					inboxed: false,
					last_reviewed_at: null,
					last_review_rating: null,
					srs_enabled: false,
					retrievability: null,
					freshness_tier: null,
					days_until_next_tier: null,
					children_count: 0,
					related_outgoing_count: 0,
					related_incoming_count: 0
				},
				{
					id: 998,
					name: 'Mock Related Topic 2',
					notes: 'Another mock related topic for testing.',
					inserted_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					parent_id: null,
					fsrs_state_id: null,
					stability: null,
					inherited_stability: null,
					inherited_difficulty: null,
					inherited_state: null,
					inherited_step: null,
					inherited_last_review: null,
					difficulty: null,
					state: 'LEARNING',
					step: 1,
					archived: false,
					inboxed: false,
					last_reviewed_at: null,
					last_review_rating: null,
					srs_enabled: true,
					retrievability: null,
					freshness_tier: null,
					days_until_next_tier: null,
					children_count: 0,
					related_outgoing_count: 0,
					related_incoming_count: 0
				}
			]

			return HttpResponse.json(mockRelatedTopics)
		}
	)
]

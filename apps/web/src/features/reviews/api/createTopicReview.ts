import * as v from 'valibot'
import {
	type LearningState,
	type Rating,
	TopicReviewSchema
} from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

// Inline topic creation payload
type TopicCreate = {
	name: string
	notes: string
	archived: boolean
	inboxed: boolean
	stability?: number | null
	difficulty?: number | null
	state?: LearningState
	step?: number | null
	due?: string | null
	srs_enabled?: boolean
}

// Inline review creation payload
type ReviewCreate = {
	description: string
	notes: string
	scheduled_at?: string | null
	completed_at?: string | null
}

// Payload options for createTopicReview
type CreateTopicReviewPayload = {
	rating?: Rating | null
} & (
	| { topic_id: number; topic?: never }
	| { topic: TopicCreate; topic_id?: never }
) &
	(
		| { review_id: number; review?: never }
		| { review: ReviewCreate; review_id?: never }
	)

/**
 * Creates a topic-review link, optionally creating the topic and/or review inline.
 *
 * Supports:
 * - Linking existing topic + existing review (topic_id + review_id)
 * - Creating new topic + linking to existing review (topic + review_id)
 * - Linking existing topic + creating new review (topic_id + review)
 * - Creating both new topic and review (topic + review)
 */
export async function createTopicReview(payload: CreateTopicReviewPayload) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topic-reviews/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(TopicReviewSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

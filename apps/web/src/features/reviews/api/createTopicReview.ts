import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback } from 'react'
import * as v from 'valibot'
import { topicKeys } from '~/features/topics/api/queryKeys'
import {
	type LearningState,
	type Rating,
	type Topic,
	TopicReviewSchema
} from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'
import { reviewKeys } from './queryKeys'

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

type CreateTopicWithReviewInput = {
	name?: string
	notes?: string
	stability?: number | null
	difficulty?: number | null
	state?: 'LEARNING' | 'REVIEW' | 'RELEARNING'
	archived?: boolean
	inboxed?: boolean
}

/**
 * Hook that creates a topic along with an associated "Created" review.
 * This encapsulates the common pattern of creating a topic and immediately
 * logging it as a completed review for tracking purposes.
 *
 * Uses the POST /topic-reviews endpoint with inline topic and review creation
 * to create both entities and link them in a single API call.
 */
export function useCreateTopicWithReview() {
	const queryClient = useQueryClient()

	const { mutateAsync: createTopicReviewMutation, isPending } = useMutation({
		mutationFn: createTopicReview,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: reviewKeys.all })
			queryClient.invalidateQueries({ queryKey: topicKeys.all })
		},
		retry: 2
	})

	const createTopicWithReview = useCallback(
		async (input: CreateTopicWithReviewInput = {}): Promise<Topic> => {
			// Create both topic and review in a single API call
			const topicReview = await createTopicReviewMutation({
				topic: {
					name: input.name ?? '',
					notes: input.notes ?? '',
					archived: input.archived ?? false,
					inboxed: input.inboxed ?? true,
					stability: input.stability,
					difficulty: input.difficulty,
					state: input.state,
					srs_enabled: true
				},
				review: {
					description: 'Created',
					notes: '',
					scheduled_at: null,
					completed_at: dayjs().format('YYYY-MM-DD')
				},
				rating: 'good'
			})

			// Return the created topic from the response
			return topicReview.topic
		},
		[createTopicReviewMutation]
	)

	return {
		createTopicWithReview,
		isTopicCreatePending: isPending,
		isReviewCreatePending: false, // No longer separate
		isTopicReviewCreatePending: false, // No longer separate
		isPending
	}
}

export function useCreateTopicReview() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: createTopicReview,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: topicKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all })
			])
		}
	})
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback } from 'react'
import * as v from 'valibot'
import { topicKeys } from '~/features/topics/api/queryKeys'
import type { Topic } from '~/features/topics/types/topic.types'
import { apiFetch } from '~/utils/apiFetch'
import type {
	CreateReviewPayload,
	CreateTopicWithReviewInput
} from '../types/api.types'
import { ReviewSchema } from '../types/review.schemas'
import { reviewKeys } from './queryKeys'

/**
 * Creates a review, optionally creating the topic and/or review session inline.
 */
export async function createReview(payload: CreateReviewPayload) {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/reviews/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	})

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(ReviewSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useCreateTopicWithReview() {
	const queryClient = useQueryClient()

	const { mutateAsync: createReviewMutation, isPending } = useMutation({
		mutationFn: createReview,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: reviewKeys.all })
			queryClient.invalidateQueries({ queryKey: topicKeys.all })
		},
		retry: 2
	})

	const createTopicWithReview = useCallback(
		async (input: CreateTopicWithReviewInput = {}): Promise<Topic> => {
			// Create both topic and review session (and review) in a single API call
			const review = await createReviewMutation({
				topic: {
					name: input.name ?? '',
					notes: input.notes ?? '',
					archived: input.archived ?? false,
					inboxed: input.inboxed ?? false,
					stability: input.stability,
					difficulty: input.difficulty,
					state: input.state,
					srs_enabled: true
				},
				review_session: {
					description: 'Created',
					notes: '',
					scheduled_at: null,
					completed_at: dayjs().format('YYYY-MM-DD')
				},
				rating: 'good',
				description: 'Created',
				scheduled_at: null,
				completed_at: dayjs().format('YYYY-MM-DD')
			})

			// Return the created topic from the response
			return review.topic
		},
		[createReviewMutation]
	)

	return {
		createTopicWithReview,
		isTopicCreatePending: isPending,
		isReviewCreatePending: false,
		isTopicReviewCreatePending: false,
		isPending
	}
}

export function useCreateReview() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: createReview,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: topicKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all })
			])
		}
	})
}

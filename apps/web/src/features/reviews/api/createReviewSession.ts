import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import type { CreateReviewSessionInput } from '../types/api.types'
import { ReviewSessionSchema } from '../types/review.schemas'
import { reviewKeys } from './queryKeys'

export async function createReviewSession(input: CreateReviewSessionInput) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/review-sessions/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				description: input.description,
				notes: input.notes ?? '',
				scheduled_at: input.scheduledAt,
				completed_at: input.completedAt
			})
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(ReviewSessionSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useCreateReviewSession() {
	const queryClient = useQueryClient()

	const { mutateAsync, isPending } = useMutation({
		mutationFn: createReviewSession,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: reviewKeys.all })
		}
	})

	return {
		createReviewSession: mutateAsync,
		isPending
	}
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { ReviewSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

type CreateReviewInput = {
	description: string
	notes?: string
	scheduledAt?: string | null
	completedAt?: string | null
}

export async function createReview(input: CreateReviewInput) {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/reviews/`, {
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

export function useCreateReview() {
	const queryClient = useQueryClient()

	const { mutateAsync, isPending } = useMutation({
		mutationFn: createReview,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
		}
	})

	return {
		createReview: mutateAsync,
		isPending
	}
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { TopicSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'

type UpdateTopicInput = {
	id: number
	name?: string
	notes?: string
	archived?: boolean
	inboxed?: boolean
	srs_enabled?: boolean
}

export async function updateTopic(input: UpdateTopicInput) {
	const { id, ...updateData } = input
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${id}/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updateData)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(TopicSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useUpdateTopic() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateTopic,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})
}

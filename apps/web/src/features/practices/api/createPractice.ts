import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import type { CreatePracticeInput } from '../types/api.types'
import { PracticeSchema } from '../types/practice.schemas'
import type { Practice } from '../types/practice.types'
import { practiceKeys } from './queryKeys'

export async function createPractice(
	input: CreatePracticeInput = {}
): Promise<Practice> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				prompt: input.prompt ?? '',
				answer: input.answer ?? '',
				archived: input.archived ?? false,
				inboxed: input.inboxed ?? false,
				srs_enabled: input.srs_enabled ?? true
			})
		}
	)

	const data = await response.json()
	try {
		return v.parse(PracticeSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useCreatePractice() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: createPractice,
		onSuccess: async () => {
			// Invalidate practice and review queries to reflect the new practice
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: practiceKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all })
			])
		}
	})
}

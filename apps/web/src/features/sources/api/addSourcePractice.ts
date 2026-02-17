import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { practiceKeys } from '~/features/practices/api/queryKeys'
import { PracticeSchema } from '~/features/practices/types/practice.schemas'
import type { Practice } from '~/features/practices/types/practice.types'
import { apiFetch } from '~/utils/apiFetch'
import { sourceKeys } from './queryKeys'

export type AddSourcePracticeInput =
	| {
			sourceId: number
			practiceId: number
	  }
	| {
			sourceId: number
			practice: {
				prompt: string
				answer: string
				archived: boolean
				inboxed: boolean
				srs_enabled?: boolean
				inherit_fsrs?: boolean
			}
	  }

export async function addSourcePractice(
	input: AddSourcePracticeInput
): Promise<Practice> {
	const body =
		'practiceId' in input
			? { practice_id: input.practiceId }
			: {
					practice: {
						prompt: input.practice.prompt,
						answer: input.practice.answer,
						archived: input.practice.archived,
						inboxed: input.practice.inboxed,
						srs_enabled: input.practice.srs_enabled,
						inherit_fsrs: input.practice.inherit_fsrs
					}
				}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${input.sourceId}/practices/`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

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

export function useAddSourcePractice() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: addSourcePractice,
		onSuccess: async (practice, input) => {
			const practiceId = 'practiceId' in input ? input.practiceId : practice.id
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: sourceKeys.byId(input.sourceId)
				}),
				queryClient.invalidateQueries({
					queryKey: practiceKeys.byId(practiceId)
				}),
				queryClient.invalidateQueries({
					queryKey: practiceKeys.all
				})
			])
		}
	})
}

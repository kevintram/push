import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { apiFetch } from '~/utils/apiFetch'
import type { CreateSourceInput } from '../types/api.types'
import { SourceSchema } from '../types/source.schemas'
import type { Source } from '../types/source.types'
import { sourceKeys } from './queryKeys'

export async function createSource(
	input: CreateSourceInput = {}
): Promise<Source> {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/sources/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			title: input.title ?? '',
			notes: input.notes ?? '',
			status: input.status ?? 'NEW',
			progress_note: input.progress_note ?? '',
			archived: input.archived ?? false,
			inboxed: input.inboxed ?? false,
			parent_id: input.parent_id ?? null,
			srs_enabled: input.srs_enabled ?? true,
			inherit_fsrs: input.inherit_fsrs ?? false
		})
	})

	const data = await response.json()
	try {
		return v.parse(SourceSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useCreateSource() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: createSource,
		onSuccess: async () => {
			// Invalidate source and review queries to reflect the new source
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: sourceKeys.all }),
				queryClient.invalidateQueries({ queryKey: reviewKeys.all })
			])
		}
	})
}

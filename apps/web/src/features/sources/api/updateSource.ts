import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { reviewKeys } from '~/features/reviews/api/queryKeys'
import { searchKeys } from '~/features/search/api/searchAll'
import { apiFetch } from '~/utils/apiFetch'
import type { UpdateSourceInput } from '../types/api.types'
import { SourceSchema } from '../types/source.schemas'
import { sourceKeys } from './queryKeys'

export async function updateSource(input: UpdateSourceInput) {
	const { id, ...updateData } = input
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${id}/`,
		{
			method: 'PATCH',
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
		return v.parse(SourceSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useUpdateSource(
	onSuccessOverride?: (
		data: v.InferOutput<typeof SourceSchema>
	) => Promise<unknown> | unknown
) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateSource,
		onSuccess: async data => {
			if (onSuccessOverride) {
				await onSuccessOverride(data)
			} else {
				queryClient.invalidateQueries({
					queryKey: sourceKeys.all
				})
				queryClient.invalidateQueries({
					queryKey: reviewKeys.all
				})
				queryClient.invalidateQueries({
					queryKey: searchKeys.all
				})
			}
		}
	})
}

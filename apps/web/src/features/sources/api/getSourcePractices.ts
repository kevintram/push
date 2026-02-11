import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { PracticeSchemaBase } from '~/features/practices/types/practice.schemas'
import { apiFetch } from '~/utils/apiFetch'
import { sourceKeys } from './queryKeys'

export async function getSourcePractices(sourceId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${sourceId}/practices/`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(PracticeSchemaBase), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useSourcePractices(
	sourceId: number | undefined,
	options?: {
		enabled?: boolean
	}
) {
	return useQuery({
		queryKey: sourceKeys.practices(sourceId ?? 0),
		queryFn: () => {
			if (!sourceId) throw new Error('Source ID is required')
			return getSourcePractices(sourceId)
		},
		enabled: sourceId !== undefined && (options?.enabled ?? true)
	})
}

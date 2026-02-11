import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { SourceSchemaBase } from '../types/source.schemas'
import { sourceKeys } from './queryKeys'

export async function getSourceChildren(sourceId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${sourceId}/children/`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(SourceSchemaBase), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useSourceChildren(
	sourceId: number | undefined,
	options?: {
		enabled?: boolean
	}
) {
	return useQuery({
		queryKey: sourceKeys.children(sourceId ?? 0),
		queryFn: () => {
			if (!sourceId) throw new Error('Source ID is required')
			return getSourceChildren(sourceId)
		},
		enabled: sourceId !== undefined && (options?.enabled ?? true)
	})
}

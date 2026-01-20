import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { SourceSchema } from '../types/source.schemas'
import type { Source } from '../types/source.types'
import { sourceKeys } from './queryKeys'

export async function getSource(sourceId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${sourceId}/`,
		{
			method: 'GET'
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

/**
 * Hook to fetch a source with its direct children and topics (depth = 1 only)
 */
export function useSourceWithRelationships(sourceId: number | undefined) {
	const { data: sourceData, isLoading } = useQuery({
		queryKey: sourceKeys.detail(sourceId!),
		queryFn: () => getSource(sourceId!),
		enabled: sourceId !== undefined
	})

	const source: Source | undefined = useMemo(() => {
		if (!sourceData) return

		return {
			...sourceData,
			children: sourceData.children ?? [],
			topics: sourceData.topics ?? []
		}
	}, [sourceData])

	return { source, isLoading }
}

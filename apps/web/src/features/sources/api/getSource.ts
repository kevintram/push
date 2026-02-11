import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { SourceSchema } from '../types/source.schemas'
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

export function useSourceWithRelationships(sourceId: number | undefined) {
	const { data: source, isLoading } = useQuery({
		queryKey: sourceKeys.detail(sourceId!),
		queryFn: () => getSource(sourceId!),
		enabled: sourceId !== undefined
	})

	return { source, isLoading }
}

import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { SearchResultItemSchema } from '../types/search.schemas'
import type { SearchAllParams, SearchResultItem } from '../types/search.types'

export const searchKeys = {
	all: ['search'] as const,
	list: (params: SearchAllParams) => [...searchKeys.all, params] as const
}

export async function searchAll(
	params: SearchAllParams = {}
): Promise<Array<SearchResultItem>> {
	const searchParams = new URLSearchParams()

	if (params.query !== undefined) {
		searchParams.append('query', params.query)
	}

	if (params.entityTypes !== undefined) {
		searchParams.append('entity_types', params.entityTypes)
	}

	if (params.archived !== undefined) {
		searchParams.append('archived', String(params.archived))
	}

	if (params.limit !== undefined) {
		searchParams.append('limit', String(params.limit))
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/search/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(SearchResultItemSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useSearchAll(
	params: SearchAllParams = {},
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: searchKeys.list(params),
		queryFn: () => searchAll(params),
		enabled: options?.enabled ?? true
	})
}

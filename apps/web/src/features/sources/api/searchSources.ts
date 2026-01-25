import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { SourceSchema } from '../types/source.schemas'
import type { Source } from '../types/source.types'
import { sourceKeys } from './queryKeys'

export interface SearchSourcesParams {
	query?: string
	limit?: number
	addableAsParentTo?: number
	addableAsChildTo?: number
}

const SourceSearchResponseSchema = v.array(SourceSchema)

export async function searchSources(
	params: SearchSourcesParams = {}
): Promise<Array<Source>> {
	const searchParams = new URLSearchParams()

	const trimmedQuery = params.query?.trim()
	if (trimmedQuery) {
		searchParams.set('query', trimmedQuery)
	}

	if (typeof params.limit === 'number') {
		searchParams.set('limit', String(params.limit))
	}

	if (typeof params.addableAsParentTo === 'number') {
		searchParams.set('addable_as_parent_to', String(params.addableAsParentTo))
	}

	if (typeof params.addableAsChildTo === 'number') {
		searchParams.set('addable_as_child_to', String(params.addableAsChildTo))
	}

	const url = `${import.meta.env.VITE_API_URL}/sources/search/${
		searchParams.size > 0 ? `?${searchParams.toString()}` : ''
	}`

	const response = await apiFetch(url)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(SourceSearchResponseSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useSearchSources(
	params: SearchSourcesParams & {
		enabled?: boolean
	}
) {
	const { enabled = true, ...searchParams } = params

	return useQuery({
		queryKey: sourceKeys.search(searchParams),
		queryFn: () => searchSources(searchParams),
		enabled
	})
}

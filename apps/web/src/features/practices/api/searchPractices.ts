import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import type { SearchPracticesParams } from '../types/api.types'
import { PracticeSchema } from '../types/practice.schemas'
import type { Practice } from '../types/practice.types'
import { practiceKeys } from './queryKeys'

export async function searchPractices(
	params: SearchPracticesParams = {}
): Promise<Array<Practice>> {
	const searchParams = new URLSearchParams()

	if (params.query !== undefined) {
		searchParams.append('query', params.query)
	}

	if (params.limit !== undefined) {
		searchParams.append('limit', String(params.limit))
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/search/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(PracticeSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useSearchPractices(
	params: SearchPracticesParams = {},
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: practiceKeys.search(params),
		queryFn: () => searchPractices(params),
		enabled: options?.enabled ?? true
	})
}

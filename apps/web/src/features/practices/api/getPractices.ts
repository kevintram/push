import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import type { GetPracticesParams } from '../types/api.types'
import { PracticeSchema } from '../types/practice.schemas'
import type { Practice } from '../types/practice.types'
import { practiceKeys } from './queryKeys'

export async function getPractices(
	params: GetPracticesParams = {}
): Promise<Array<Practice>> {
	const searchParams = new URLSearchParams()

	if (params.inboxed !== undefined) {
		searchParams.append('inboxed', String(params.inboxed))
	}

	if (params.archived !== undefined) {
		searchParams.append('archived', String(params.archived))
	}

	if (params.order !== undefined) {
		searchParams.append('order', params.order)
	}

	if (params.limit !== undefined) {
		searchParams.append('limit', String(params.limit))
	}

	if (params.hasStability !== undefined) {
		searchParams.append('has_stability', String(params.hasStability))
	}

	if (params.srsEnabled !== undefined) {
		searchParams.append('srs_enabled', String(params.srsEnabled))
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
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

export function usePractices(
	params: GetPracticesParams = {},
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: practiceKeys.list(params),
		queryFn: () => getPractices(params),
		enabled: options?.enabled ?? true
	})
}

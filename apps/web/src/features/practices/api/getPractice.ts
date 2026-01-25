import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { PracticeSchema } from '../types/practice.schemas'
import type { Practice } from '../types/practice.types'
import { practiceKeys } from './queryKeys'

export async function getPractice(practiceId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/practices/${practiceId}/`,
		{
			method: 'GET'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(PracticeSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

/**
 * Hook to fetch a practice with its topics and sources relationships
 */
export function usePracticeWithRelationships(practiceId: number | undefined) {
	const { data: practiceData, isLoading } = useQuery({
		queryKey: practiceKeys.detail(practiceId!),
		queryFn: () => getPractice(practiceId!),
		enabled: practiceId !== undefined
	})

	const practice: Practice | undefined = useMemo(() => {
		if (!practiceData) return

		return {
			...practiceData,
			topics: practiceData.topics ?? [],
			sources: practiceData.sources ?? []
		}
	}, [practiceData])

	return { practice, isLoading }
}

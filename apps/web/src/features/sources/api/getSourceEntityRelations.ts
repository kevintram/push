import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import type { RelatedEntityItem } from '~/features/topics/types/topic.types'
import { EntityRelationsResponseSchema } from '~/models/entity-relations.schema'
import { apiFetch } from '~/utils/apiFetch'
import { sourceKeys } from './queryKeys'

type EntityRelationsResponse = {
	outgoing: Array<RelatedEntityItem>
	incoming: Array<RelatedEntityItem>
}

export async function getSourceEntityRelations(
	sourceId: number
): Promise<EntityRelationsResponse> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/sources/${sourceId}/entity-relations/`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(
			EntityRelationsResponseSchema,
			data
		) as EntityRelationsResponse
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useSourceEntityRelations(
	sourceId: number | undefined,
	options?: {
		enabled?: boolean
	}
) {
	return useQuery({
		queryKey: sourceKeys.related(sourceId ?? 0),
		queryFn: () => {
			if (!sourceId) throw new Error('Source ID is required')
			return getSourceEntityRelations(sourceId)
		},
		enabled: sourceId !== undefined && (options?.enabled ?? true)
	})
}

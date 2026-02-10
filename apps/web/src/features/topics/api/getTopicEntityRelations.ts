import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { EntityRelationsResponseSchema } from '~/models/entity-relations.schema'
import { apiFetch } from '~/utils/apiFetch'
import type { RelatedEntityItem } from '../types/topic.types'
import { topicKeys } from './queryKeys'

type EntityRelationsResponse = {
	outgoing: Array<RelatedEntityItem>
	incoming: Array<RelatedEntityItem>
}

export async function getTopicEntityRelations(
	topicId: number
): Promise<EntityRelationsResponse> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${topicId}/entity-relations/`
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

export function useTopicEntityRelations(
	topicId: number | undefined,
	options?: {
		enabled?: boolean
	}
) {
	return useQuery({
		queryKey: topicKeys.entityRelations(topicId ?? 0),
		queryFn: () => {
			if (!topicId) throw new Error('Topic ID is required')
			return getTopicEntityRelations(topicId)
		},
		enabled: topicId !== undefined && (options?.enabled ?? true)
	})
}

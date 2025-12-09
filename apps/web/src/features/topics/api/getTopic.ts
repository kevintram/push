import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { TopicSchema } from '../types/topic.schemas'
import type { Topic } from '../types/topic.types'
import { topicKeys } from './queryKeys'

export async function getTopic(topicId: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${topicId}/`,
		{
			method: 'GET'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(TopicSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

/**
 * Hook to fetch a topic with its direct parents and children (depth = 1 only)
 */
export function useTopicWithRelationships(topicId: number | undefined) {
	const { data: topicData, isLoading } = useQuery({
		queryKey: topicKeys.detail(topicId!),
		queryFn: () => getTopic(topicId!),
		enabled: topicId !== undefined
	})

	const topic: Topic | undefined = useMemo(() => {
		if (!topicData) return

		return {
			...topicData,
			parents: topicData.parents ?? [],
			children: topicData.children ?? []
		}
	}, [topicData])

	return { topic, isLoading }
}

import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useMemo } from 'react'
import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'

/**
 * Hook to fetch a topic with its direct parents and children (depth = 1 only)
 */
export function useTopicWithRelationships(topicId: number | undefined) {
	// Fetch the main topic
	const { data: topicData, isLoading: topicLoading } = useQuery<
		Tables<'topics'>
	>(
		supabase
			.from('topics')
			.select('*')
			.eq('id', topicId ?? 0)
			.single(),
		{
			enabled: topicId !== undefined
		}
	)

	// Fetch parent IDs (where this topic is a descendant at depth 1)
	const { data: parentRelations, isLoading: parentRelationsLoading } = useQuery(
		supabase
			.from('topics_closure')
			.select('ancestor')
			.eq('descendant', topicId ?? 0)
			.eq('depth', 1),
		{
			enabled: topicId !== undefined
		}
	)

	// Fetch child IDs (where this topic is an ancestor at depth 1)
	const { data: childRelations, isLoading: childRelationsLoading } = useQuery(
		supabase
			.from('topics_closure')
			.select('descendant')
			.eq('ancestor', topicId ?? 0)
			.eq('depth', 1),
		{
			enabled: topicId !== undefined
		}
	)

	const parentIds = useMemo(
		() => parentRelations?.map(r => r.ancestor) ?? [],
		[parentRelations]
	)
	const childIds = useMemo(
		() => childRelations?.map(r => r.descendant) ?? [],
		[childRelations]
	)

	// Fetch parent topics
	const { data: parentTopics, isLoading: parentTopicsLoading } = useQuery<
		Array<Tables<'topics'>>
	>(supabase.from('topics').select('*').in('id', parentIds), {
		enabled: parentIds.length > 0
	})

	// Fetch child topics
	const { data: childTopics, isLoading: childTopicsLoading } = useQuery<
		Array<Tables<'topics'>>
	>(supabase.from('topics').select('*').in('id', childIds), {
		enabled: childIds.length > 0
	})

	const topic: Topic | undefined = useMemo(() => {
		if (!topicData) return

		return {
			...topicData,
			parents: parentTopics ?? [],
			children: childTopics ?? []
		}
	}, [topicData, parentTopics, childTopics])

	const isLoading =
		topicLoading ||
		parentRelationsLoading ||
		childRelationsLoading ||
		parentTopicsLoading ||
		childTopicsLoading

	return { topic, isLoading }
}

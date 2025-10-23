import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useMemo } from 'react'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

/**
 * Hook to fetch the count of direct parents and children for a topic,
 * along with the actual parent and child topics
 */
export function useTopicRelationshipCounts(topicId: number | undefined) {
	// Fetch parent IDs (where this topic is a descendant at depth 1)
	const { data: parentRelations } = useQuery(
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
	const { data: childRelations } = useQuery(
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
	const { data: parentTopics } = useQuery<Array<Tables<'topics'>>>(
		supabase.from('topics').select('*').in('id', parentIds),
		{
			enabled: parentIds.length > 0
		}
	)

	// Fetch child topics
	const { data: childTopics } = useQuery<Array<Tables<'topics'>>>(
		supabase.from('topics').select('*').in('id', childIds),
		{
			enabled: childIds.length > 0
		}
	)

	const parentCount = useMemo(
		() => parentRelations?.length ?? 0,
		[parentRelations]
	)

	const childCount = useMemo(
		() => childRelations?.length ?? 0,
		[childRelations]
	)

	return {
		parentCount,
		childCount,
		parentTopics: parentTopics ?? [],
		childTopics: childTopics ?? []
	}
}

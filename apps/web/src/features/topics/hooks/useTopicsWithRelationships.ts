import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useMemo } from 'react'
import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'

/**
 * Hook to fetch multiple topics with their direct parents and children (depth = 1 only)
 */
export function useTopicsWithRelationships(topicIds: Array<number>) {
	// Fetch all topics
	const { data: topicsData, isLoading: topicsLoading } = useQuery<
		Array<Tables<'topics'>>
	>(supabase.from('topics').select('*').in('id', topicIds), {
		enabled: topicIds.length > 0
	})

	// Fetch all parent relationships (where these topics are descendants at depth 1)
	const { data: parentRelations, isLoading: parentRelationsLoading } = useQuery<
		Array<{ ancestor: number; descendant: number }>
	>(
		supabase
			.from('topics_closure')
			.select('ancestor, descendant')
			.in('descendant', topicIds)
			.eq('depth', 1),
		{
			enabled: topicIds.length > 0
		}
	)

	// Fetch all child relationships (where these topics are ancestors at depth 1)
	const { data: childRelations, isLoading: childRelationsLoading } = useQuery<
		Array<{ ancestor: number; descendant: number }>
	>(
		supabase
			.from('topics_closure')
			.select('ancestor, descendant')
			.in('ancestor', topicIds)
			.eq('depth', 1),
		{
			enabled: topicIds.length > 0
		}
	)

	// Get unique parent and child IDs
	const parentIds = useMemo(
		() => [...new Set(parentRelations?.map(r => r.ancestor) ?? [])],
		[parentRelations]
	)

	const childIds = useMemo(
		() => [...new Set(childRelations?.map(r => r.descendant) ?? [])],
		[childRelations]
	)

	// Fetch all parent topics
	const { data: parentTopics, isLoading: parentTopicsLoading } = useQuery<
		Array<Tables<'topics'>>
	>(supabase.from('topics').select('*').in('id', parentIds), {
		enabled: parentIds.length > 0
	})

	// Fetch all child topics
	const { data: childTopics, isLoading: childTopicsLoading } = useQuery<
		Array<Tables<'topics'>>
	>(supabase.from('topics').select('*').in('id', childIds), {
		enabled: childIds.length > 0
	})

	// Build lookup maps
	const parentsByDescendant = useMemo(() => {
		if (!(parentRelations && parentTopics))
			return new Map<number, Array<Topic>>()
		const map = new Map<number, Array<Topic>>()
		for (const relation of parentRelations) {
			const parent = parentTopics.find(p => p.id === relation.ancestor)
			if (parent) {
				if (!map.has(relation.descendant)) {
					map.set(relation.descendant, [])
				}
				map.get(relation.descendant)!.push(parent)
			}
		}
		return map
	}, [parentRelations, parentTopics])

	const childrenByAncestor = useMemo(() => {
		if (!(childRelations && childTopics)) return new Map<number, Array<Topic>>()
		const map = new Map<number, Array<Topic>>()
		for (const relation of childRelations) {
			const child = childTopics.find(c => c.id === relation.descendant)
			if (child) {
				if (!map.has(relation.ancestor)) {
					map.set(relation.ancestor, [])
				}
				map.get(relation.ancestor)!.push(child)
			}
		}
		return map
	}, [childRelations, childTopics])

	// Enrich topics with relationships, preserving the order from topicIds
	const topics: Array<Topic> = useMemo(() => {
		if (!topicsData) return []

		// Create a map for quick lookup
		const topicMap = new Map(topicsData.map(t => [t.id, t]))

		return topicIds.reduce<Array<Topic>>((accumulator, id) => {
			const topic = topicMap.get(id)
			if (!topic) return accumulator

			const enrichedTopic: Topic = {
				...topic,
				parents: parentsByDescendant.get(id) ?? [],
				children: childrenByAncestor.get(id) ?? []
			}

			accumulator.push(enrichedTopic)
			return accumulator
		}, [])
	}, [topicIds, topicsData, parentsByDescendant, childrenByAncestor])

	const isLoading =
		topicsLoading ||
		parentRelationsLoading ||
		childRelationsLoading ||
		parentTopicsLoading ||
		childTopicsLoading

	return { topics, isLoading }
}

import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useMemo } from 'react'
import { useTopicsWithRelationships } from '~/features/topics/hooks/useTopicsWithRelationships'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

export function useInboxTopics() {
	const { data: inboxTopics, isLoading: topicsLoading } = useQuery<
		Array<Tables<'topics'>>
	>(
		supabase
			.from('topics')
			.select('*')
			.eq('is_inboxed', true)
			.order('inserted_at', { ascending: false })
	)

	const inboxTopicIds = useMemo(
		() => inboxTopics?.map(t => t.id) ?? [],
		[inboxTopics]
	)

	const { topics: enrichedTopics, isLoading: relationshipsLoading } =
		useTopicsWithRelationships(inboxTopicIds)

	return {
		data: enrichedTopics,
		isLoading: topicsLoading || relationshipsLoading
	}
}

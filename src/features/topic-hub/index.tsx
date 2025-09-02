import {
	useInsertMutation,
	useQuery
} from '@supabase-cache-helpers/postgrest-react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'
import { TopicPage } from './components/Topic/TopicPage'
import { TopicList } from './components/TopicList'
import {
	getRootTopics,
	parseTopicRelationships
} from './utils/parseTopicRelationships'

export function TopicHub({ topicId }: { topicId: number | undefined }) {
	const { data: topicsData, isLoading: topicsDataLoading } = useQuery<
		Array<Tables<'topics'>>
	>(
		supabase
			.from('topics')
			.select('*')
			.order('inserted_at', { ascending: false })
	)
	const { data: directRelationships, isLoading: directRelationshipsLoading } =
		useQuery(supabase.from('topics_closure').select('*').eq('depth', 1))
	const isLoading = directRelationshipsLoading || topicsDataLoading

	const topicsMap: Map<number, Topic> = useMemo(() => {
		if (!(directRelationships && topicsData)) return new Map<number, Topic>()

		return parseTopicRelationships(directRelationships, topicsData)
	}, [directRelationships, topicsData])

	const topics: Array<Topic> | undefined = useMemo(() => {
		if (!topicsMap) return

		return getRootTopics(topicsMap)
	}, [topicsMap])

	const selectedTopic = topicId ? topicsMap.get(topicId) : undefined

	return (
		<div className='relative flex h-screen w-full'>
			<TopicList
				isLoading={topicsDataLoading || directRelationshipsLoading}
				selectedTopic={selectedTopic}
				topics={topics}
			/>

			{selectedTopic && (
				<TopicPage isLoading={isLoading} topic={selectedTopic} />
			)}
		</div>
	)
}

import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useMemo } from 'react'
import { SidebarInset, SidebarProvider } from '~/components/ui/Sidebar'
import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'
import { TopicPage } from './components/Topic/TopicPage'
import { TopicListSidebar } from './components/TopicListSidebar'
import { TopicHubContext } from './stores/SelectedTopicContext'
import {
	getRootTopics,
	parseTopicRelationships
} from './utils/parseTopicRelationships'
import { TimelineSidebar } from './components/Topic/TimelineSidebar'

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
		<div className='flex h-screen w-full'>
			<TopicHubContext value={{ selectedTopic }}>
				<SidebarProvider defaultOpen={true}>
					<TopicListSidebar
						isLoading={topicsDataLoading || directRelationshipsLoading}
						topics={topics}
					/>
					<SidebarInset>
						{selectedTopic && <TopicPage isLoading={isLoading} />}
					</SidebarInset>
					<TimelineSidebar />
				</SidebarProvider>
			</TopicHubContext>
		</div>
	)
}

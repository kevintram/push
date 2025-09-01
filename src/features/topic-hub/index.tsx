<<<<<<< HEAD
import { TopicPage } from './components/Topic/TopicPage'
import { TopicList } from './components/TopicList'
=======
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useState } from 'react'
import { PracticeAndNotes } from '~/features/topic-hub/components/PracticeAndNotes'
import { TopicFamilyPanel } from '~/features/topic-hub/components/TopicFamilyPanel'
import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'
import { TimelineSidebar } from './components/TimelineSidebar'
import { TopicHeader } from './components/TopicHeader'
import { TopicListSidebar } from './components/TopicListSidebar'
import { SelectedTopicContext } from './stores/SelectedTopicContext'
import { parseSupabaseTopic } from './utils/parseSupabaseTopic'

// const parseTopics = (topics: Array<any>): Array<Topic> => {
// 	const parseSingleTopic = (t: any): Topic => ({
// 		...t,
// 		created: new Date(t.created),
// 		reviewHistory: t.reviewHistory.map((session: any) => ({
// 			...session,
// 			date: new Date(session.date)
// 		})),
// 		children: parseTopics(t.children)
// 	})

// 	return topics.map(parseSingleTopic)
// }

// const topics = parseTopics(topicsJson)

export function TopicHub() {
	// const [topics, setTopics] = useState<Array<Topic>>([])

	// useEffect(() => {
	// 	supabase
	// 		.from('topics')
	// 		.select('*, timeline_entries(*)')
	// 		.then(({ data }) => {
	// 			if (data) {
	// 				const parsedTopics: Array<Topic> = data.map(parseSupabaseTopic)
	// 				setTopics(parsedTopics)
	// 			}
	// 		})
	// }, [])

	const { data } = useQuery<Array<Tables<'topics'>>>(
		supabase
			.from('topics')
			.select('*')
			.order('inserted_at', { ascending: false })
	)

	const topics: Array<Topic> = data?.map(parseSupabaseTopic) ?? []

	const [selectedTopic, setSelectedTopic] = useState<Topic>()

	// const [selectedTopic, setSelectedTopic] = useState<Topic>()

	// TODO: refactor to use shadcn sidebar add sidebar state management

	// const handleTopicSelectByName = useCallback((topicName: string) => {
	// 	const foundTopic = mockTopics.find(topic => topic.title === topicName)
	// 	if (foundTopic) {
	// 		setSelectedTopic(foundTopic)
	// 	}
	// }, [])
>>>>>>> 46da30be548ebd09805def517566dadf53595fea

export function TopicHub({ topicId }: { topicId: number | undefined }) {
	return (
		<div className='relative flex h-screen w-full'>
			<TopicList selectedTopicId={topicId} />

			{topicId && <TopicPage topicId={topicId} />}
		</div>
	)
}

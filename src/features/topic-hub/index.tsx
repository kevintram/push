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
		supabase.from('topics').select('*')
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

	return (
		<div className='relative flex h-screen w-full'>
			<SelectedTopicContext value={{ selectedTopic, setSelectedTopic }}>
				<TopicListSidebar topics={topics} />

				<div className='flex flex-1 flex-col'>
					{/* <PageHeader
					isReviewSidebarCollapsed={isReviewSidebarCollapsed}
					isTopicSidebarCollapsed={isTopicSidebarCollapsed}
					setIsReviewSideBarCollapsed={setIsReviewSideBarCollapsed}
					setIsTopicSideBarCollapsed={setIsTopicSideBarCollapsed}
				/> */}

					{selectedTopic && (
						<div className='flex w-full flex-1 flex-col gap-4 overflow-auto p-3 sm:gap-6 sm:p-4 md:p-6'>
							<TopicHeader
								createdAt={selectedTopic.inserted_at}
								id={selectedTopic.id}
								key={selectedTopic.id}
								name={selectedTopic.name}
								retrievability={selectedTopic.retrievability}
								stability={selectedTopic.stability}
							/>

							<TopicFamilyPanel topic={selectedTopic} />

							<PracticeAndNotes />
						</div>
					)}
				</div>

				<TimelineSidebar />
			</SelectedTopicContext>
		</div>
	)
}

// function PageHeader() {

// 	return (
// 		<div className='flex items-center justify-between border-b bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:p-3'>
// 			<Button
// 				className='h-8 w-8 sm:h-9 sm:w-9'
// 				onClick={() => setIsTopicSideBarCollapsed(!isTopicSidebarCollapsed)}
// 				size='icon'
// 				title={
// 					isTopicSidebarCollapsed
// 						? 'Show Topics Sidebar'
// 						: 'Hide Topics Sidebar'
// 				}
// 				variant='ghost'
// 			>
// 				<PanelLeft className='h-4 w-4' />
// 			</Button>
// 			<div className='hidden font-medium text-muted-foreground text-xs sm:block sm:text-sm'>
// 				Library
// 			</div>
// 			<Button
// 				className='h-8 w-8 sm:h-9 sm:w-9'
// 				onClick={() => setIsReviewSideBarCollapsed(!isReviewSidebarCollapsed)}
// 				size='icon'
// 				title={
// 					isReviewSidebarCollapsed
// 						? 'Show Review Sidebar'
// 						: 'Hide Review Sidebar'
// 				}
// 				variant='ghost'
// 			>
// 				<PanelRight className='h-4 w-4' />
// 			</Button>
// 		</div>
// 	)
//}

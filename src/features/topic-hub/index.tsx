import { useCallback, useState } from 'react'
import topicsJson from '~/__mocks__/data/topics.json' with { type: 'json' }
import { PracticeNotesPanel } from '~/features/topic-hub/components/PracticeNotesPanel'
import { TopicFamilyPanel } from '~/features/topic-hub/components/TopicFamilyPanel'
import type { Topic } from '~/types/topics.types'
import { ReviewSidebar } from './components/ReviewSidebar'
import { TopicHeader } from './components/TopicHeader'
import { TopicListSidebar } from './components/TopicListSidebar'

const parseTopics = (topics: Array<any>): Array<Topic> => {
	const parseSingleTopic = (t: any): Topic => ({
		...t,
		created: new Date(t.created),
		reviewHistory: t.reviewHistory.map((session: any) => ({
			...session,
			date: new Date(session.date)
		})),
		children: parseTopics(t.children)
	})

	return topics.map(parseSingleTopic)
}

const topics = parseTopics(topicsJson)

export function TopicHub() {
	const [selectedTopic, setSelectedTopic] = useState<Topic>(topics[0]!)

	const onTopicSelected = useCallback((topic: Topic) => {
		setSelectedTopic(topic)
	}, [])

	// TODO: refactor to use shadcn sidebar add sidebar state management

	// const handleTopicSelectByName = useCallback((topicName: string) => {
	// 	const foundTopic = mockTopics.find(topic => topic.title === topicName)
	// 	if (foundTopic) {
	// 		setSelectedTopic(foundTopic)
	// 	}
	// }, [])

	return (
		<div className='relative flex h-screen w-full'>
			<TopicListSidebar
				onTopicSelected={onTopicSelected}
				selectedTopicId={selectedTopic.id}
				topics={topics}
			/>

			<div className='flex flex-1 flex-col'>
				{/* <PageHeader
					isReviewSidebarCollapsed={isReviewSidebarCollapsed}
					isTopicSidebarCollapsed={isTopicSidebarCollapsed}
					setIsReviewSideBarCollapsed={setIsReviewSideBarCollapsed}
					setIsTopicSideBarCollapsed={setIsTopicSideBarCollapsed}
				/> */}

				{selectedTopic && (
					<div className='flex w-full flex-1 flex-col gap-4 overflow-auto p-3 sm:gap-6 sm:p-4 md:p-6'>
						<TopicHeader topic={selectedTopic} />

						<TopicFamilyPanel
							onTopicSelected={onTopicSelected}
							topic={selectedTopic}
						/>

						<PracticeNotesPanel topic={selectedTopic} />
					</div>
				)}
			</div>

			<ReviewSidebar reviewHistory={selectedTopic.reviewHistory} />
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

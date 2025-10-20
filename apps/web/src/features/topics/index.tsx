import { SidebarProvider } from '~/components/ui/Sidebar'
import { TimelineSidebar } from './components/TopicPage/TimelineSidebar'
import { TopicPage } from './components/TopicPage/TopicPage'
import { useTopicWithRelationships } from './hooks/useTopicWithRelationships'
import { TopicContext } from './stores/SelectedTopicContext'

export function TopicHub({ topicId }: { topicId: number | undefined }) {
	const { topic: selectedTopic, isLoading } = useTopicWithRelationships(topicId)

	return (
		<div className='flex h-screen w-full'>
			<TopicContext value={{ topic: selectedTopic }}>
				<SidebarProvider defaultOpen={true}>
					<div className='mx-auto flex h-full w-full max-w-screen-lg flex-1'>
						{selectedTopic && <TopicPage isLoading={isLoading} />}
					</div>
					<TimelineSidebar />
				</SidebarProvider>
			</TopicContext>
		</div>
	)
}

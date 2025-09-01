import { TopicPage } from './components/Topic/TopicPage'
import { TopicList } from './components/TopicList'

export function TopicHub({ topicId }: { topicId: number | undefined }) {
	return (
		<div className='relative flex h-screen w-full'>
			<TopicList selectedTopicId={topicId} />

			{topicId && <TopicPage topicId={topicId} />}
		</div>
	)
}

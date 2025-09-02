import type { Topic } from '~/types/topics.types'
import { SelectedTopicIdContext } from '../../stores/SelectedTopicIdContext'
import { TopicListHeader } from './TopicListHeader'
import { TopicListItem } from './TopicListItem'
import { TopicListSkeleton } from './TopicListSkeleton'

export function TopicList({
	topics,
	isLoading,
	selectedTopic,
	onCreateTopic
}: {
	topics: Array<Topic> | undefined
	isLoading: boolean
	selectedTopic: Topic | undefined
	onCreateTopic: () => void
}) {
	if (isLoading) {
		return <TopicListSkeleton />
	}

	if (!topics || topics?.length === 0) {
		return (
			<div className='flex h-full flex-col gap-4 p-4'>
				<TopicListHeader onCreateTopic={onCreateTopic} />

				<div className='flex flex-1 items-center justify-center'>
					<div className='text-center text-muted-foreground'>
						<p>No topics found</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='flex h-full flex-col gap-4 p-4'>
			<TopicListHeader onCreateTopic={onCreateTopic} />

			<div className='flex-1 overflow-auto'>
				<div className='space-y-1'>
					<SelectedTopicIdContext
						value={{ selectedTopicId: selectedTopic?.id }}
					>
						{topics.map(topic => (
							<TopicListItem key={topic.id} topic={topic} />
						))}
					</SelectedTopicIdContext>
				</div>
			</div>
		</div>
	)
}

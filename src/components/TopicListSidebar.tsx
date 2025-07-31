import { Plus, Search } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'
import type { Topic } from '~/types/topic-hub'
import { TopicTreeItem } from './TopicTreeItem'

interface TopicListSidebarProps {
	topics: Array<Topic>
	onTopicSelect: (topic: Topic) => void
	selectedTopicId: string
}

export function TopicListSidebar({
	topics,
	onTopicSelect,
	selectedTopicId
}: TopicListSidebarProps) {
	return (
		<div className='flex h-full flex-col gap-4 p-4'>
			<div className='flex items-center gap-2'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
					<Input className='pl-9' placeholder='Search topics...' />
				</div>
				<Button size='icon' variant='secondary'>
					<Plus className='h-4 w-4' />
				</Button>
			</div>

			<div className='flex-1 overflow-auto'>
				<div className='space-y-1'>
					{topics.map(topic => (
						<TopicTreeItem
							key={topic.id}
							onTopicSelect={onTopicSelect}
							selectedTopicId={selectedTopicId}
							topic={topic}
							allTopics={topics}
							siblings={topics}
						/>
					))}
				</div>
			</div>
		</div>
	)
}
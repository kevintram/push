import { Plus, Search } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'
import type { Topic } from '~/types/topics.types'
import { SelectedTopicContext } from '../stores/SelectedTopicContext'
import { IsSelectedWrapper } from './IsSelectedWrapper'
import { TopicListItem } from './TopicListItem'

interface TopicListSidebarProps {
	topics: Array<Topic>
	onTopicSelected: (topic: Topic) => void
	selectedTopicId: string | null
}

export function TopicListSidebar({
	topics,
	onTopicSelected,
	selectedTopicId = null
}: TopicListSidebarProps) {
	return (
		<div className='flex h-full flex-col gap-4 p-4'>
			<div className='flex items-center gap-2'>
				<div className='relative flex-1'>
					<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
					<Input className='pl-9' placeholder='Search topics...' />
				</div>
				<Button size='icon' variant='secondary'>
					<Plus className='h-4 w-4' />
				</Button>
			</div>

			<div className='flex-1 overflow-auto'>
				<div className='space-y-1'>
					<SelectedTopicContext value={{ selectedTopicId }}>
						{topics.map(topic => (
							<IsSelectedWrapper key={topic.id} topic={topic}>
								<TopicListItem
									onTopicSelected={onTopicSelected}
									topic={topic}
								/>
							</IsSelectedWrapper>
						))}
					</SelectedTopicContext>
				</div>
			</div>
		</div>
	)
}

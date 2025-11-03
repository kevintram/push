import { Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { useCreateTopic } from '~/features/topics/api/useCreateTopic'
import { TopicDialog } from '~/features/topics/components/TopicDialog'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import type { Topic } from '~/models/todo-topic.types'
import { useInboxTopics } from '../api'
import { InboxList } from './InboxList'

export function InboxPage() {
	const { data: inboxTopics, isLoading } = useInboxTopics()
	const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const { mutateAsync: createTopicAsync } = useCreateTopic()

	const handleTopicSelect = useCallback((topic: Topic) => {
		setSelectedTopic(topic)
		setIsDialogOpen(true)
	}, [])

	const handleDialogOpenChange = useCallback((open: boolean) => {
		setIsDialogOpen(open)
		if (!open) {
			setSelectedTopic(null)
		}
	}, [])

	const handleTopicChange = useCallback((topic: Topic) => {
		setSelectedTopic(topic)
	}, [])

	const handleCreateTopic = useCallback(async () => {
		const newTopic = await createTopicAsync({ inboxed: true })
		setSelectedTopic(newTopic)
		setIsDialogOpen(true)
	}, [createTopicAsync])

	const contextValue = useMemo(
		() => ({
			topic: selectedTopic ?? undefined,
			onTopicChange: handleTopicChange
		}),
		[selectedTopic, handleTopicChange]
	)

	const inboxCountLabel = isLoading ? '...' : (inboxTopics?.length ?? 0)

	return (
		<div className='scrollbar-track-transparent relative h-full w-full'>
			<div className='flex h-full flex-col overflow-auto'>
				<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 bg-primary-foreground px-4 pt-4 pb-1'>
					<div className='flex items-center justify-between'>
						<h1 className='font-bold text-xl'>
							Inbox{' '}
							<span className='font-semibold text-muted-foreground text-xl'>
								({inboxCountLabel})
							</span>
						</h1>
						<Button onClick={handleCreateTopic} size='icon' variant='ghost'>
							<Plus />
						</Button>
					</div>
				</div>
				<div className='p-6 pt-2'>
					<InboxList
						isLoading={isLoading}
						onTopicSelect={handleTopicSelect}
						topics={inboxTopics}
					/>
				</div>

				<TopicContext value={contextValue}>
					<TopicDialog
						onOpenChange={handleDialogOpenChange}
						open={isDialogOpen}
					/>
				</TopicContext>
			</div>
		</div>
	)
}

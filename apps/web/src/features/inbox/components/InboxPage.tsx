import { Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { TopicDialog } from '~/components/TopicDialog'
import { Button } from '~/components/ui/Button'
import { CreateTopicDialog } from '~/features/topics/components/CreateTopicDialog'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'
import { useInboxTopics } from '../api'
import { InboxList } from './InboxList'

export function InboxPage() {
	const { data: inboxTopics, isLoading } = useInboxTopics()
	const [selectedTopic, setSelectedTopic] = useState<Tables<'topics'> | null>(
		null
	)
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	const handleTopicSelect = useCallback((topic: Tables<'topics'>) => {
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

	const contextValue = useMemo(
		() => ({
			topic: selectedTopic as Topic | undefined,
			onTopicChange: handleTopicChange
		}),
		[selectedTopic, handleTopicChange]
	)

	const inboxCountLabel = isLoading ? '...' : (inboxTopics?.length ?? 0)

	return (
		<div className='scrollbar-track-transparent relative h-full w-full'>
			<div className='flex h-full flex-col overflow-auto'>
				<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 bg-primary-foreground px-8 pt-6 pb-0'>
					<div className='flex items-center justify-between'>
						<h1 className='font-bold text-2xl'>
							Inbox{' '}
							<span className='font-semibold text-muted-foreground text-xl'>
								({inboxCountLabel})
							</span>
						</h1>
						<CreateTopicDialog
							showSidebar={false}
							submitButtonText='Create Topic'
							title='Add Topic'
							topicDefaults={{ is_inboxed: true }}
							trigger={
								<Button size='icon' variant='ghost'>
									<Plus />
								</Button>
							}
						/>
					</div>
				</div>
				<div className='p-8 pt-2'>
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

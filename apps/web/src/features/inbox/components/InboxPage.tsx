import { Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { TopicDialog } from '~/components/TopicDialog'
import { Button } from '~/components/ui/Button'
import { TopicContext } from '~/features/topic-hub/stores/SelectedTopicContext'
import { CreateTopicDialog } from '~/features/topics/components/CreateTopicDialog'
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
		<div className='scrollbar-track-transparent relative h-full w-full overflow-auto'>
			<div className='mx-auto my-16 flex flex-col items-center'>
				<div className='flex w-full max-w-screen-lg flex-row items-center justify-between'>
					<h1 className='font-bold text-4xl'>
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
							<Button>
								<Plus className='h-4 w-4' />
							</Button>
						}
					/>
				</div>
				<div className='h-full w-full p-6'>
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

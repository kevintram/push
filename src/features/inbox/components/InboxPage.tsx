import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { TopicDialog } from '~/components/TopicDialog'
import { Button } from '~/components/ui/Button'
import { CreateTopicDialog } from '~/features/topics/components/CreateTopicDialog'
import type { Tables } from '~/types/database.types'
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

	return (
		<div className='container mx-auto'>
			<div className='sticky top-0 z-10 bg-background/95 p-6 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
				<div className='flex items-center justify-between'>
					<h1 className='font-bold text-3xl'>Inbox</h1>
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
			</div>
			<div className='px-6 pb-6'>
				<InboxList
					isLoading={isLoading}
					onTopicSelect={handleTopicSelect}
					topics={inboxTopics}
				/>
			</div>

			<TopicDialog
				onOpenChange={handleDialogOpenChange}
				open={isDialogOpen}
				topic={selectedTopic}
			/>
		</div>
	)
}

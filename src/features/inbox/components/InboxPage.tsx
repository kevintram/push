import { useCallback, useState } from 'react'
import { TopicDialog } from '~/components/TopicDialog'
import type { Tables } from '~/types/database.types'
import { useInboxTopics } from '../api'
import { CreateInboxTopic } from './CreateInboxTopic'
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
					<CreateInboxTopic />
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

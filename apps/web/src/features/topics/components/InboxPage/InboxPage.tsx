import { Inbox } from 'lucide-react'
import { useCallback } from 'react'
import { PageHeader } from '~/components/PageHeader'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import type { Topic } from '~/models/review-topic.types'
import { useInboxTopics } from '../../hooks'
import { InboxList } from './InboxList'

export function InboxPage() {
	const { data: inboxTopics, isLoading } = useInboxTopics()
	const { openTopicDialog } = useReviewTopicDialog()

	const handleTopicSelect = useCallback(
		(topic: Topic) => {
			openTopicDialog(topic.id)
		},
		[openTopicDialog]
	)

	const inboxCountLabel = isLoading ? '...' : (inboxTopics?.length ?? 0)

	return (
		<div className='scrollbar-track-transparent relative h-full w-full'>
			<div className='flex h-full flex-col overflow-auto'>
				<PageHeader icon={Inbox} title='Inbox'>
					<span className='font-semibold text-muted-foreground text-xl'>
						({inboxCountLabel})
					</span>
				</PageHeader>
				<div className='p-6'>
					<InboxList
						isLoading={isLoading}
						onTopicSelect={handleTopicSelect}
						topics={inboxTopics}
					/>
				</div>
			</div>
		</div>
	)
}

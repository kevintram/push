import { Inbox } from 'lucide-react'
import { useCallback } from 'react'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import type { Topic } from '~/models/review-topic.types'
import { useInboxTopics } from '../hooks'
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
				<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 border-b-1 bg-primary-foreground/40 px-4 pt-4 pb-2 backdrop-blur-sm'>
					<div className='flex items-center justify-between'>
						<h1 className='flex items-center gap-2 font-bold text-xl'>
							<Inbox className='h-5 w-5' />
							Inbox{' '}
							<span className='font-semibold text-muted-foreground text-xl'>
								({inboxCountLabel})
							</span>
						</h1>
					</div>
				</div>
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

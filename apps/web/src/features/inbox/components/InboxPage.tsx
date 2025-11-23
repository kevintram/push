import { Plus } from 'lucide-react'
import { useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateTopicWithReview } from '~/features/topics/hooks/useCreateTopicWithReview'
import type { Topic } from '~/models/review-topic.types'
import { useInboxTopics } from '../api'
import { InboxList } from './InboxList'

export function InboxPage() {
	const { data: inboxTopics, isLoading } = useInboxTopics()
	const { createTopicWithReview } = useCreateTopicWithReview()
	const { openTopicDialog } = useReviewTopicDialog()

	const handleTopicSelect = useCallback(
		(topic: Topic) => {
			openTopicDialog(topic.id)
		},
		[openTopicDialog]
	)

	const handleCreateTopic = useCallback(async () => {
		const newTopic = await createTopicWithReview({ inboxed: true })
		openTopicDialog(newTopic.id)
	}, [createTopicWithReview, openTopicDialog])

	const inboxCountLabel = isLoading ? '...' : (inboxTopics?.length ?? 0)

	return (
		<div className='scrollbar-track-transparent relative h-full w-full'>
			<div className='flex h-full flex-col overflow-auto'>
				<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 border-b-1 bg-primary-foreground/40 px-4 pt-4 pb-2 backdrop-blur-sm'>
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

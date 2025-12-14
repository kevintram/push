import { useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { topicKeys } from '../../api/queryKeys'
import type { Topic } from '../../types/topic.types'
import { TopicActionMenu } from '../TopicActionMenu'
import { TopicParentsPanel } from '../TopicParentsPanel'

interface TopicDetailHeaderProps {
	topic: Topic
	onDelete?: () => void
	/**
	 * Content to render in the left section before the parents panel (e.g., navigation buttons)
	 */
	headerBeforeActions?: ReactNode
	/**
	 * Content to render before the "more" dropdown (e.g., review status button)
	 */
	beforeActions?: ReactNode
	/**
	 * Content to render after the "more" dropdown (e.g., close/minimize buttons)
	 */
	afterActions?: ReactNode
	/**
	 * Callback when a parent is selected. If not provided, uses default dialog behavior.
	 */
	onParentSelect?: (topicId: number) => void
}

export function TopicDetailHeader({
	topic,
	onDelete,
	headerBeforeActions,
	beforeActions,
	afterActions,
	onParentSelect
}: TopicDetailHeaderProps) {
	const queryClient = useQueryClient()

	const handleTopicUpdateSuccess = useCallback(
		(updatedTopic: Topic) => {
			queryClient.setQueryData(topicKeys.detail(updatedTopic.id), updatedTopic)
		},
		[queryClient]
	)

	return (
		<div className='sticky top-0 z-10 w-full border-b'>
			<div className='flex items-center justify-between gap-4 px-2 py-1'>
				<div className='flex min-w-0 flex-1 items-center gap-4'>
					{headerBeforeActions}
					<TopicParentsPanel
						onParentSelect={onParentSelect}
						topicId={topic.id}
					/>
				</div>

				<div className='flex items-center gap-2'>
					{beforeActions}

					<TopicActionMenu
						onDelete={onDelete}
						onTopicUpdateSuccess={handleTopicUpdateSuccess}
						topic={topic}
						trigger={
							<Button
								className='h-6 w-6 p-0'
								size='sm'
								title='More options'
								variant='ghost'
							>
								<MoreHorizontal className='h-4 w-4' />
							</Button>
						}
					/>

					{afterActions}
				</div>
			</div>
		</div>
	)
}

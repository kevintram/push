import type { ReactNode } from 'react'
import type { Topic } from '../../types/topic.types'
import { TopicParentsPanel } from '../TopicParentsPanel'

interface TopicDetailHeaderProps {
	topic: Topic
	/**
	 * Content to render in the left section before the parents panel (e.g., navigation buttons)
	 */
	headerBeforeActions?: ReactNode
	/**
	 * Content to render on the right side (e.g., close/minimize buttons)
	 */
	afterActions?: ReactNode
	/**
	 * Callback when a parent is selected. If not provided, uses default dialog behavior.
	 */
	onParentSelect?: (topicId: number) => void
}

export function TopicDetailHeader({
	topic,
	headerBeforeActions,
	afterActions,
	onParentSelect
}: TopicDetailHeaderProps) {
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

				{afterActions && (
					<div className='flex items-center gap-2'>{afterActions}</div>
				)}
			</div>
		</div>
	)
}

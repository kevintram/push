import { use } from 'react'
import { cn } from '~/lib/utils'
import type { Topic } from '~/types/topics.types'
import { SelectedTopicContext } from '../stores/SelectedTopicContext'

/**
 * Wraps topic 
 *
 * Created this to avoid re-rendering TopicListItem when the selected topic changes (TopicListItem is memoized).
 */
export function IsSelectedWrapper({
	topic,
	children
}: {
	topic: Topic
	children: React.ReactNode
}) {
	const { selectedTopicId } = use(SelectedTopicContext)
	const isSelected = topic.id === selectedTopicId

	return (
		<div
			className={cn(
				isSelected && 'bg-primary/10 text-primary',
				'rounded-md px-3 py-2 transition-colors hover:bg-muted/50'
			)}
		>
			{children}
		</div>
	)
}

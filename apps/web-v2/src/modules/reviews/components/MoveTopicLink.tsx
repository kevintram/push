import type { Id } from '@convex/_generated/dataModel'

import {
	TreeItem,
	TreeItemChildren,
	TreeItemCollapsibleTrigger,
	TreeItemContent,
	TreeItemLabel,
} from '~/components/ui'
import type { TopicWithChildren } from '~/modules/library/types/topic.types'

type MoveTopicLinkProps = TopicWithChildren & {
	onSelect: (topicId: Id<'topics'>) => void
	selectedTopicId: Id<'topics'>
}

export function MoveTopicLink({
	_id,
	title,
	childTopics,
	onSelect,
	selectedTopicId,
}: MoveTopicLinkProps) {
	const topicTitle = title.trim() || 'Untitled'
	const hasChildren = childTopics.length > 0
	const isSelected = selectedTopicId === _id

	return (
		<TreeItem
			expandable={hasChildren}
			label={topicTitle}
			selected={isSelected}
		>
			<TreeItemContent>
				<TreeItemCollapsibleTrigger />
				<TreeItemLabel
					aria-pressed={isSelected}
					onClick={() => onSelect(_id)}
				>
					{topicTitle}
				</TreeItemLabel>
			</TreeItemContent>

			<TreeItemChildren>
				{childTopics.map(child => (
					<MoveTopicLink
						key={child._id}
						{...child}
						onSelect={onSelect}
						selectedTopicId={selectedTopicId}
					/>
				))}
			</TreeItemChildren>
		</TreeItem>
	)
}

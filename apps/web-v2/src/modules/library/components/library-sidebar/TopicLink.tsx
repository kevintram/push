import * as stylex from '@stylexjs/stylex'
import { Plus, Trash2 } from 'lucide-react'

import { SidebarLink } from '~/components/sidebar-link'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '~/components/ui'
import { spacing } from '~/styles/tokens.stylex'

import { type TopicWithChildren } from '../../types/topic.types'

export type TopicDeleteTarget = Pick<
	TopicWithChildren,
	'children' | 'id' | 'parentId' | 'title'
>

type TopicLinkProps = TopicWithChildren & {
	isAddingTopic: boolean
	isDeletingTopic: boolean
	onAddSubtopic: (parentId: number) => void
	onDeleteTopic: (topic: TopicDeleteTarget) => void
}

const styles = stylex.create({
	item: {
		gap: spacing.xs,

		display: 'flex',
		flexDirection: 'column',
	},
	children: {
		gap: spacing.xs,

		display: 'flex',
		flexDirection: 'column',

		paddingInlineStart: spacing.md,
	},
})

export function TopicLink({
	id,
	parentId,
	title,
	children,
	isAddingTopic,
	isDeletingTopic,
	onAddSubtopic,
	onDeleteTopic,
}: TopicLinkProps) {
	const topicTitle = title.trim() || 'Untitled'

	return (
		<li {...stylex.props(styles.item)}>
			<ContextMenu>
				<ContextMenuTrigger
					render={
						<SidebarLink
							to='/library/$topicId'
							params={{ topicId: String(id) }}
							text={topicTitle}
						/>
					}
				>
					{topicTitle}
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem
						disabled={isAddingTopic}
						onClick={() => onAddSubtopic(id)}
					>
						<Plus aria-hidden='true' size={16} />
						Add subtopic
					</ContextMenuItem>
					<ContextMenuItem
						disabled={isDeletingTopic}
						onClick={() =>
							onDeleteTopic({ children, id, parentId, title })
						}
					>
						<Trash2 aria-hidden='true' size={16} />
						Delete
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>

			{children && children.length > 0 ? (
				<ul {...stylex.props(styles.children)}>
					{children.map(child => (
						<TopicLink
							key={child.id}
							{...child}
							isAddingTopic={isAddingTopic}
							isDeletingTopic={isDeletingTopic}
							onAddSubtopic={onAddSubtopic}
							onDeleteTopic={onDeleteTopic}
						/>
					))}
				</ul>
			) : null}
		</li>
	)
}

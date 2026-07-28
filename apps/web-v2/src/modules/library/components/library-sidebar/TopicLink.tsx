import * as stylex from '@stylexjs/stylex'
import { Plus, Trash2 } from 'lucide-react'

import { SidebarLink } from '~/components/sidebar-link'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '~/components/ui'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import { type TopicWithChildren } from '../../types/topic.types'

export type TopicDeleteTarget = Pick<
	TopicWithChildren,
	'children' | 'id' | 'parentId' | 'title'
>

type TopicLinkProps = TopicWithChildren & {
	isAddingTopic: boolean
	isDeletingTopic: boolean
	pendingParentId?: string
	onAddSubtopic: (parentId: string) => void
	onDeleteTopic: (topic: TopicDeleteTarget) => void
}

const styles = stylex.create({
	container: {
		gap: spacing.xs,

		display: 'flex',
		flexDirection: 'column',
	},
	childrenList: {
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
	pendingParentId,
	onAddSubtopic,
	onDeleteTopic,
}: TopicLinkProps) {
	const topicTitle = title.trim() || 'Untitled'

	return (
		<li {...stylex.props(styles.container)}>
			<ContextMenu>
				<ContextMenuTrigger
					render={
						<SidebarLink
							to='/library/$topicId'
							params={{ topicId: id }}
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
						<Plus aria-hidden='true' size={iconSizes.md} />
						Add subtopic
					</ContextMenuItem>
					<ContextMenuItem
						disabled={isDeletingTopic}
						onClick={() =>
							onDeleteTopic({ children, id, parentId, title })
						}
					>
						<Trash2 aria-hidden='true' size={iconSizes.md} />
						Delete
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>

			{(children && children.length > 0) || pendingParentId === id ? (
				<ul {...stylex.props(styles.childrenList)}>
					{children?.map(child => (
						<TopicLink
							key={child.id}
							{...child}
							isAddingTopic={isAddingTopic}
							isDeletingTopic={isDeletingTopic}
							pendingParentId={pendingParentId}
							onAddSubtopic={onAddSubtopic}
							onDeleteTopic={onDeleteTopic}
						/>
					))}
					{pendingParentId === id ? (
						<li aria-disabled='true'>Creating topic…</li>
					) : null}
				</ul>
			) : null}
		</li>
	)
}

import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '~/components/ui'
import { colors, fontSizes, radii, spacing } from '~/styles/tokens.stylex'

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
	link: {
		borderRadius: radii.md,

		paddingBlock: spacing.xs,
		paddingInline: spacing.sm,

		textDecoration: 'none',

		backgroundColor: {
			'[data-status=active]': colors.surfaceActive,
			':hover': colors.surfaceActive,
		},

		color: 'inherit',
		display: 'block',

		fontSize: fontSizes.sm,
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
	return (
		<li {...stylex.props(styles.item)}>
			<ContextMenu>
				<ContextMenuTrigger
					render={
						<Link
							to='/library/$topicId'
							params={{ topicId: String(id) }}
							{...stylex.props(styles.link)}
						/>
					}
				>
					{title.trim() || 'Untitled'}
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem
						disabled={isAddingTopic}
						onClick={() => onAddSubtopic(id)}
					>
						<Plus aria-hidden='true' size={16} />
						Add subtopic
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						disabled={isDeletingTopic}
						variant='destructive'
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

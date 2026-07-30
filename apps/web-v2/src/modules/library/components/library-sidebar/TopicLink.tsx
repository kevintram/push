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

export function TopicLink({ _id, title, childTopics }: TopicWithChildren) {
	const topicTitle = title.trim() || 'Untitled'

	return (
		<li {...stylex.props(styles.container)}>
			<ContextMenu>
				<ContextMenuTrigger
					render={
						<SidebarLink
							to='/library/$topicId'
							params={{ topicId: _id }}
							text={topicTitle}
						/>
					}
				>
					{topicTitle}
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem disabled>
						<Plus aria-hidden='true' size={iconSizes.md} />
						Add subtopic
					</ContextMenuItem>
					<ContextMenuItem disabled>
						<Trash2 aria-hidden='true' size={iconSizes.md} />
						Delete
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>

			{childTopics.length > 0 ? (
				<ul {...stylex.props(styles.childrenList)}>
					{childTopics.map(child => (
						<TopicLink key={child._id} {...child} />
					))}
				</ul>
			) : null}
		</li>
	)
}

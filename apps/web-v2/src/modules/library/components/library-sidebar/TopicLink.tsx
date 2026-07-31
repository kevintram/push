import * as stylex from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useCallback } from 'react'

import { SidebarLink } from '~/components/sidebar-link'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '~/components/ui'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import { useCreateTopic, useDeleteTopic } from '../../api/topicQueries'
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
	const navigate = useNavigate()
	const createTopic = useCreateTopic()
	const deleteTopic = useDeleteTopic()

	const handleCreateSubtopic = useCallback(() => {
		createTopic.mutate(
			{ parentId: _id },
			{
				onSuccess: topicId =>
					navigate({ to: '/library/$topicId', params: { topicId } }),
			},
		)
	}, [navigate, createTopic, _id])

	const handleDeleteTopic = useCallback(() => {
		deleteTopic.mutate({ topicId: _id })
	}, [_id, deleteTopic])

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
					<ContextMenuItem onClick={handleCreateSubtopic}>
						<Plus aria-hidden='true' size={iconSizes.md} />
						Add subtopic
					</ContextMenuItem>
					<ContextMenuItem onClick={handleDeleteTopic}>
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

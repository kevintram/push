import { useDroppable } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback } from 'react'

import { Button, Tree } from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
import { fontWeights, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { useCreateTopic } from '../../api/topicQueries'
import type { TopicWithChildren } from '../../types/topic.types'
import { TopicLink } from './TopicLink'

const styles = stylex.create({
	container: { overflowY: 'auto' },
	header: {
		padding: spacing.xs,
		marginInline: spacing.xs,
		marginBlockStart: spacing.md,

		display: 'flex',

		borderRadius: radii.md,
	},
	headerIsDropTarget: {
		backgroundColor: colors.navBgSurfaceActive,
	},
	headerText: {
		paddingInline: spacing.sm,
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		fontWeight: fontWeights.semibold,
	},
	nav: {
		padding: spacing.md,
		flexShrink: 0,
		inlineSize: '240px',
		height: '100%',
	},
})

type LibrarySidebarContentProps = {
	topics: ReadonlyArray<TopicWithChildren>
}

export function LibrarySidebarContent({ topics }: LibrarySidebarContentProps) {
	const createTopic = useCreateTopic()
	const navigate = useNavigate()
	const { ref: droppableHeaderRef, isDropTarget: headerIsDropTarget } =
		useDroppable({
			id: 'library-root',
		})

	const handleCreateTopic = useCallback(() => {
		createTopic.mutate(
			{},
			{
				onSuccess: topicId =>
					navigate({ to: '/library/$topicId', params: { topicId } }),
			},
		)
	}, [navigate, createTopic])

	return (
		<div {...stylex.props(styles.container)}>
			<div
				ref={droppableHeaderRef}
				{...stylex.props(
					styles.header,
					headerIsDropTarget && styles.headerIsDropTarget,
				)}
			>
				<p {...stylex.props(styles.headerText)}>Library</p>
				<Button.Icon
					aria-label='Add topic'
					shape='round'
					size='micro'
					variant='ghost'
					onClick={handleCreateTopic}
				>
					<Plus aria-hidden='true' size={iconSizes.md} />
				</Button.Icon>
			</div>
			<nav aria-label='Library topics' {...stylex.props(styles.nav)}>
				<Tree>
					{topics.map(topic => (
						<TopicLink key={topic._id} {...topic} />
					))}
				</Tree>
			</nav>
		</div>
	)
}

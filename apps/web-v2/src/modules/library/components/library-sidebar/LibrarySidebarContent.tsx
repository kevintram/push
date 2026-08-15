import { useDroppable } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback } from 'react'

import { Button } from '~/components/ui'
import { fontWeights, iconSizes, spacing } from '~/styles/tokens.stylex'

import { useCreateTopic } from '../../api/topicQueries'
import type { TopicWithChildren } from '../../types/topic.types'
import { TopicLink } from './TopicLink'

const styles = stylex.create({
	container: { overflowY: 'auto' },
	header: {
		padding: spacing.md,
		display: 'flex',
		paddingBlockEnd: spacing.none,
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
	list: {
		margin: 0,
		padding: 0,
		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',
		listStyleType: 'none',
	},
})

type LibrarySidebarContentProps = {
	topics: ReadonlyArray<TopicWithChildren>
}

export function LibrarySidebarContent({ topics }: LibrarySidebarContentProps) {
	const createTopic = useCreateTopic()
	const navigate = useNavigate()
	const { ref: droppableHeaderRef } = useDroppable({
		id: 'droppable-library-root',
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
			<div ref={droppableHeaderRef} {...stylex.props(styles.header)}>
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
				<ul {...stylex.props(styles.list)}>
					{topics.map(topic => (
						<TopicLink key={topic._id} {...topic} />
					))}
				</ul>
			</nav>
		</div>
	)
}

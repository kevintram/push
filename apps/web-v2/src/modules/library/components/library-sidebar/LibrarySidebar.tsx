import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import { Button } from '~/components/ui'
import { fontWeights, iconSizes, spacing } from '~/styles/tokens.stylex'

import { useCreateTopic } from '../../api/createTopic'
import { useDeleteTopic } from '../../api/deleteTopic'
import { topicQueries } from '../../api/queries'
import { type TopicDeleteTarget, TopicLink } from './TopicLink'

const styles = stylex.create({
	container: {
		overflowY: 'auto',
	},
	header: {
		display: 'flex',

		padding: spacing.md,
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

		display: 'flex',
		flexDirection: 'column',

		listStyleType: 'none',
	},
})

function containsTopic(topic: TopicDeleteTarget, topicId?: string): boolean {
	if (topicId === undefined) return false
	if (String(topic.id) === topicId) return true
	return topic.children?.some(child => containsTopic(child, topicId)) ?? false
}

export function LibrarySidebar() {
	const navigate = useNavigate()
	const { topicId: currentTopicId } = useParams({ strict: false })
	const { data } = useQuery(topicQueries.list())
	const { isPending: isCreatingTopic, mutateAsync: createTopic } =
		useCreateTopic()
	const { isPending: isDeletingTopic, mutateAsync: deleteTopic } =
		useDeleteTopic()
	const [topicToDelete, setTopicToDelete] = useState<TopicDeleteTarget>()

	const addTopic = async (parentId?: number) => {
		try {
			const topic = await createTopic({ parentId })
			await navigate({
				to: '/library/$topicId',
				params: { topicId: String(topic.id) },
				state: previous => ({
					...previous,
					focusTopicTitle: true,
				}),
			})
		} catch {
			toast.error('Failed to create topic')
		}
	}

	const confirmDeleteTopic = async () => {
		if (!topicToDelete) return

		try {
			await deleteTopic(topicToDelete.id)
			setTopicToDelete(undefined)

			if (!containsTopic(topicToDelete, currentTopicId)) return
			if (topicToDelete.parentId === undefined) {
				await navigate({ to: '/library' })
				return
			}
			await navigate({
				to: '/library/$topicId',
				params: { topicId: String(topicToDelete.parentId) },
			})
		} catch {
			toast.error('Failed to delete topic')
		}
	}

	const topicToDeleteTitle = topicToDelete?.title.trim() || 'Untitled'

	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.header)}>
				<p {...stylex.props(styles.headerText)}>Library</p>
				<Button.Icon
					aria-label='Add topic'
					disabled={isCreatingTopic}
					size='micro'
					variant='ghost'
					onClick={() => void addTopic(undefined)}
				>
					<Plus aria-hidden='true' size={iconSizes.sm} />
				</Button.Icon>
			</div>
			<nav aria-label='Library topics' {...stylex.props(styles.nav)}>
				<ul {...stylex.props(styles.list)}>
					{data?.map(topic => (
						<TopicLink
							key={topic.id}
							{...topic}
							isAddingTopic={isCreatingTopic}
							isDeletingTopic={isDeletingTopic}
							onAddSubtopic={parentId => void addTopic(parentId)}
							onDeleteTopic={setTopicToDelete}
						/>
					))}
				</ul>
			</nav>
			<DeleteConfirmationDialog
				description='This will delete this topic, its subtopics, and all linked review cards and reviews.'
				isPending={isDeletingTopic}
				onConfirm={() => void confirmDeleteTopic()}
				onOpenChange={open => {
					if (!open && !isDeletingTopic) setTopicToDelete(undefined)
				}}
				open={topicToDelete !== undefined}
				title={`Delete “${topicToDeleteTitle}”?`}
			/>
		</div>
	)
}

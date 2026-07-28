import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useRouter } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'

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

		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',

		listStyleType: 'none',
	},
})

function containsTopic(topic: TopicDeleteTarget, topicId?: string): boolean {
	if (topicId === undefined) return false
	if (topic.id === topicId) return true
	return topic.children?.some(child => containsTopic(child, topicId)) ?? false
}

export function LibrarySidebar() {
	const navigate = useNavigate()
	const router = useRouter()
	const { topicId: currentTopicId } = useParams({ strict: false })
	const { data } = useSuspenseQuery(topicQueries.list())
	const {
		isPending: isCreatingTopic,
		mutate: createTopic,
		variables: createTopicVariables,
	} = useCreateTopic()
	const { isPending: isDeletingTopic, mutate: deleteTopic } = useDeleteTopic()
	const [topicToDelete, setTopicToDelete] = useState<TopicDeleteTarget>()

	const addTopic = (parentId?: string) => {
		const sourceHref = router.state.location.href
		createTopic(
			{ parentId },
			{
				onSuccess: topic => {
					if (router.state.location.href !== sourceHref) return
					void navigate({
						to: '/library/$topicId',
						params: { topicId: topic.id },
						state: previous => ({
							...previous,
							focusTopicTitle: true,
						}),
					})
				},
			},
		)
	}

	const confirmDeleteTopic = () => {
		const target = topicToDelete
		if (!target) return

		setTopicToDelete(undefined)
		deleteTopic(target.id)

		if (!containsTopic(target, currentTopicId)) return
		if (target.parentId === undefined) {
			void navigate({ to: '/library' })
			return
		}
		void navigate({
			to: '/library/$topicId',
			params: { topicId: target.parentId },
		})
	}

	const topicToDeleteTitle = topicToDelete?.title.trim() || 'Untitled'

	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.header)}>
				<p {...stylex.props(styles.headerText)}>Library</p>
				<Button.Icon
					aria-label='Add topic'
					disabled={isCreatingTopic}
					shape='round'
					size='micro'
					variant='ghost'
					onClick={() => void addTopic(undefined)}
				>
					<Plus aria-hidden='true' size={iconSizes.md} />
				</Button.Icon>
			</div>
			<nav aria-label='Library topics' {...stylex.props(styles.nav)}>
				<ul {...stylex.props(styles.list)}>
					{data.map(topic => (
						<TopicLink
							key={topic.id}
							{...topic}
							isAddingTopic={isCreatingTopic}
							isDeletingTopic={isDeletingTopic}
							pendingParentId={
								isCreatingTopic
									? createTopicVariables?.parentId
									: undefined
							}
							onAddSubtopic={addTopic}
							onDeleteTopic={setTopicToDelete}
						/>
					))}
					{isCreatingTopic &&
					createTopicVariables?.parentId === undefined ? (
						<li aria-disabled='true'>Creating topic…</li>
					) : null}
				</ul>
			</nav>
			<DeleteConfirmationDialog
				description='This will delete this topic, its subtopics, and all linked review cards and reviews.'
				isPending={isDeletingTopic}
				onConfirm={confirmDeleteTopic}
				onOpenChange={open => {
					if (!open) setTopicToDelete(undefined)
				}}
				open={topicToDelete !== undefined}
				title={`Delete “${topicToDeleteTitle}”?`}
			/>
		</div>
	)
}

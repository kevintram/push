import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui'
import { topicQueries } from '~/modules/library/api/topicQueries'
import { treeifyTopics } from '~/modules/library/utils/treeifyTopics'
import { colors } from '~/styles/colors.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

import { useUpdateReviewCard } from '../api/reviewCardQueries'
import type { ReviewCard } from '../types/review.types'
import { MoveTopicLink } from './MoveTopicLink'

const styles = stylex.create({
	header: {
		flexDirection: 'column',
	},
	topicTreeContainer: {
		padding: spacing.md,
		maxBlockSize: '24rem',
		overflowY: 'auto',

		borderColor: colors.border,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
	},
	topicList: {
		margin: 0,
		padding: 0,
		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',
		listStyleType: 'none',
	},
	status: {
		margin: 0,
		padding: spacing.sm,
		color: colors.textSecondary,
	},
})

type MoveReviewCardDialogProps = {
	onOpenChange: (open: boolean) => void
	reviewCard: ReviewCard
}

export function MoveReviewCardDialog({
	onOpenChange,
	reviewCard,
}: MoveReviewCardDialogProps) {
	const [selectedTopicId, setSelectedTopicId] = useState<Id<'topics'>>(
		reviewCard.topicId,
	)
	const {
		data: topics,
		isError: topicsHaveError,
		isPending: topicsArePending,
	} = useQuery(topicQueries.list())
	const updateReviewCard = useUpdateReviewCard()
	const isMoving = updateReviewCard.isPending
	const topicTree = useMemo(() => treeifyTopics(topics ?? []), [topics])
	const canMove = selectedTopicId !== reviewCard.topicId

	const handleMove = () => {
		updateReviewCard.mutate(
			{
				reviewCardId: reviewCard._id,
				topicId: selectedTopicId,
			},
			{
				onError: () => toast.error('Failed to move review card'),
				onSuccess: () => onOpenChange(false),
			},
		)
	}
	const handleOpenChange = (open: boolean) => {
		if (!isMoving) onOpenChange(open)
	}

	return (
		<Dialog open onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader xstyle={styles.header}>
					<DialogTitle>Move review card</DialogTitle>
					<DialogDescription>
						Choose a topic for this review card.
					</DialogDescription>
				</DialogHeader>

				<nav
					aria-label='Review card destination topic'
					{...stylex.props(styles.topicTreeContainer)}
				>
					{topicsArePending ? (
						<p {...stylex.props(styles.status)}>Loading topics…</p>
					) : topicsHaveError ? (
						<p {...stylex.props(styles.status)}>
							Could not load topics.
						</p>
					) : topicTree.length === 0 ? (
						<p {...stylex.props(styles.status)}>
							No topics available.
						</p>
					) : (
						<ul {...stylex.props(styles.topicList)}>
							{topicTree.map(topic => (
								<MoveTopicLink
									key={topic._id}
									{...topic}
									onSelect={setSelectedTopicId}
									selectedTopicId={selectedTopicId}
								/>
							))}
						</ul>
					)}
				</nav>

				<DialogFooter>
					<Button
						disabled={isMoving}
						variant='outline'
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						disabled={!canMove || isMoving}
						onClick={handleMove}
					>
						{isMoving ? 'Moving…' : 'Move'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

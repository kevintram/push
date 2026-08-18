import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

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

import { MoveTopicTree } from './MoveTopicTree'

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
	status: {
		margin: 0,
		padding: spacing.sm,
		color: colors.textSecondary,
	},
})

type CommonMoveTopicDialogBaseProps = {
	description?: string
	excludeTopicId?: Id<'topics'>
	isPending: boolean
	onOpenChange: (open: boolean) => void
	title: string
}

// Discriminated union so callers that don't allow library-root selection
// can't receive a null destination in onMove.
type MoveTopicDialogBaseProps = CommonMoveTopicDialogBaseProps &
	(
		| {
				allowLibraryRoot: true
				initialDestination: Id<'topics'> | null
				onMove: (destination: Id<'topics'> | null) => void
		  }
		| {
				allowLibraryRoot?: false
				initialDestination: Id<'topics'>
				onMove: (destination: Id<'topics'>) => void
		  }
	)

export function MoveTopicDialogBase(props: MoveTopicDialogBaseProps) {
	const {
		description,
		excludeTopicId,
		initialDestination,
		isPending,
		onOpenChange,
		title,
	} = props
	const [selectedDestination, setSelectedDestination] =
		useState<Id<'topics'> | null>(initialDestination)

	const {
		data: topics,
		isError: topicsHaveError,
		isPending: topicsArePending,
	} = useQuery(topicQueries.list())

	const topicTree = useMemo(() => treeifyTopics(topics ?? []), [topics])
	const canMove = selectedDestination !== initialDestination

	const handleOpenChange = (open: boolean) => {
		if (!isPending) onOpenChange(open)
	}
	const handleMove = () => {
		if (props.allowLibraryRoot) {
			props.onMove(selectedDestination)
		} else if (selectedDestination !== null) {
			props.onMove(selectedDestination)
		}
	}

	return (
		<Dialog open onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader xstyle={styles.header}>
					<DialogTitle>{title}</DialogTitle>
					{description ? (
						<DialogDescription>{description}</DialogDescription>
					) : null}
				</DialogHeader>

				<nav
					aria-label='Destination topic'
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
						<MoveTopicTree
							allowLibraryRoot={props.allowLibraryRoot ?? false}
							excludeTopicId={excludeTopicId}
							onSelect={setSelectedDestination}
							selectedDestination={selectedDestination}
							topics={topicTree}
						/>
					)}
				</nav>

				<DialogFooter>
					<Button
						disabled={isPending}
						variant='outline'
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						disabled={!canMove || isPending}
						onClick={handleMove}
					>
						{isPending ? 'Moving…' : 'Move'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

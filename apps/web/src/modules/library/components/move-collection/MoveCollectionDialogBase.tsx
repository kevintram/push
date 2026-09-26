import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui'
import { collectionQueries } from '~/modules/library/api/collectionQueries'
import { treeifyCollections } from '~/modules/library/utils/treeifyCollections'
import { moveCollectionDialogColors } from '~/styles/colors/components.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

import { MoveCollectionTree } from './MoveCollectionTree'

const styles = stylex.create({
	header: {
		flexDirection: 'column',
	},
	collectionTreeContainer: {
		padding: spacing.md,
		maxBlockSize: '24rem',
		overflowY: 'auto',

		borderColor: moveCollectionDialogColors.treeBorder,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
	},
	status: {
		margin: 0,
		padding: spacing.sm,
		color: moveCollectionDialogColors.statusForeground,
	},
})

type CommonMoveCollectionDialogBaseProps = {
	excludeCollectionId?: Id<'collections'>
	isPending: boolean
	onOpenChange: (open: boolean) => void
	title: string
}

// Discriminated union so callers that don't allow library-root selection
// can't receive a null destination in onMove.
type MoveCollectionDialogBaseProps = CommonMoveCollectionDialogBaseProps &
	(
		| {
				allowLibraryRoot: true
				initialDestination: Id<'collections'> | null
				onMove: (destination: Id<'collections'> | null) => void
		  }
		| {
				allowLibraryRoot?: false
				initialDestination: Id<'collections'>
				onMove: (destination: Id<'collections'>) => void
		  }
	)

export function MoveCollectionDialogBase(props: MoveCollectionDialogBaseProps) {
	const {
		excludeCollectionId,
		initialDestination,
		isPending,
		onOpenChange,
		title,
	} = props
	const [selectedDestination, setSelectedDestination] =
		useState<Id<'collections'> | null>(initialDestination)

	const {
		data: collections,
		isError: collectionsHaveError,
		isPending: collectionsArePending,
	} = useQuery(collectionQueries.list())

	const collectionTree = useMemo(
		() => treeifyCollections(collections ?? []).roots,
		[collections],
	)
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
				</DialogHeader>

				<nav
					aria-label='Destination collection'
					{...stylex.props(styles.collectionTreeContainer)}
				>
					{collectionsArePending ? (
						<p {...stylex.props(styles.status)}>
							Loading collections…
						</p>
					) : collectionsHaveError ? (
						<p {...stylex.props(styles.status)}>
							Could not load collections.
						</p>
					) : collectionTree.length === 0 ? (
						<p {...stylex.props(styles.status)}>
							No collections available.
						</p>
					) : (
						<MoveCollectionTree
							allowLibraryRoot={props.allowLibraryRoot ?? false}
							excludeCollectionId={excludeCollectionId}
							onSelect={setSelectedDestination}
							selectedDestination={selectedDestination}
							collections={collectionTree}
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

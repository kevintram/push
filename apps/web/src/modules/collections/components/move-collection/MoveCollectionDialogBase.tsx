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
import { collectionQueries } from '~/modules/collections/api/collectionQueries'
import { treeifyCollections } from '~/modules/collections/utils/treeifyCollections'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { scrollFade } from '~/styles/scrollFade'
import { radii, spacing } from '~/styles/tokens.stylex'

import { MoveCollectionTree } from './MoveCollectionTree'

const styles = stylex.create({
	header: {
		flexDirection: 'column',
	},
	// The border sits on a wrapper so the scroll fade dissolves the tree rows
	// without fading the border.
	collectionTreeFrame: {
		borderColor: colorsSemantic.borderSubtle,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
	},
	collectionTreeContainer: {
		padding: spacing.md,
		maxBlockSize: '24rem',
		overflowY: 'auto',
	},
	status: {
		margin: 0,
		padding: spacing.sm,
		color: colorsSemantic.textSecondary,
	},
})

type CommonMoveCollectionDialogBaseProps = {
	excludeCollectionId?: Id<'collections'>
	isPending: boolean
	onOpenChange: (open: boolean) => void
	title: string
}

// Discriminated union so callers that don't allow root selection
// can't receive a null destination in onMove.
type MoveCollectionDialogBaseProps = CommonMoveCollectionDialogBaseProps &
	(
		| {
				allowRoot: true
				initialDestination: Id<'collections'> | null
				onMove: (destination: Id<'collections'> | null) => void
		  }
		| {
				allowRoot?: false
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
		if (props.allowRoot) {
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

				<div {...stylex.props(styles.collectionTreeFrame)}>
					<nav
						aria-label='Destination collection'
						{...stylex.props(
							styles.collectionTreeContainer,
							scrollFade.y,
						)}
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
								allowRoot={props.allowRoot ?? false}
								excludeCollectionId={excludeCollectionId}
								onSelect={setSelectedDestination}
								selectedDestination={selectedDestination}
								collections={collectionTree}
							/>
						)}
					</nav>
				</div>

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

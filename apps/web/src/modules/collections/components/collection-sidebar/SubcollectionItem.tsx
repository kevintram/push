import * as stylex from '@stylexjs/stylex'
import { Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { textFade } from '~/styles/textFade'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

import {
	useCreateCollection,
	useDeleteCollection,
} from '../../api/collectionQueries'
import type { Collection } from '../../types/collection.types'
import { MoveCollectionDialog } from '../MoveCollectionDialog'

const styles = stylex.create({
	item: {
		marginBlock: spacing.xs,
		// Bleed into the panel's padding so the hover surface reads as a full-width row.
		marginInline: `calc(${spacing.sm} * -1)`,
		paddingBlock: spacing.xs,
		paddingInline: spacing.sm,

		display: 'block',
		// The list scrolls, so keep rows at full height instead of letting the
		// flex column squeeze them to fit.
		flexShrink: 0,

		borderRadius: radii.md,
		backgroundColor: {
			default: 'transparent',
			':hover': colorsSemantic.surfaceTransparentHover,
			':active': colorsSemantic.surfaceTransparentActive,
		},

		textDecoration: 'none',
		color: colorsSemantic.textPrimary,
		fontSize: fontSizes.sm,
	},
})

type SubcollectionItemProps = {
	collection: Collection
}

export function SubcollectionItem({ collection }: SubcollectionItemProps) {
	const { _id, parentId, title } = collection
	const collectionTitle = title.trim() || 'Untitled'
	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const createCollection = useCreateCollection()
	const deleteCollection = useDeleteCollection()
	const navigate = useNavigate()

	const handleCreateSubcollection = useCallback(() => {
		createCollection.mutate(
			{ parentId: _id },
			{
				onSuccess: collectionId =>
					void navigate({
						to: '/collection/$collectionId',
						params: { collectionId },
					}),
			},
		)
	}, [createCollection, navigate, _id])

	const handleDeleteCollection = useCallback(() => {
		deleteCollection.mutate(
			{ collectionId: _id },
			{ onSuccess: () => setIsDeleteDialogOpen(false) },
		)
	}, [deleteCollection, _id])

	return (
		<>
			<ContextMenu>
				<ContextMenuTrigger
					render={
						<Link
							to='/collection/$collectionId'
							params={{ collectionId: _id }}
							aria-label={collectionTitle}
							{...stylex.props(styles.item)}
						/>
					}
				>
					{/* The row keeps its hover surface, so only the title fades. */}
					<span {...stylex.props(textFade.line)}>
						{collectionTitle}
					</span>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem onClick={handleCreateSubcollection}>
						Add subcollection
					</ContextMenuItem>
					<ContextMenuItem onClick={() => setIsMoveDialogOpen(true)}>
						Move
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						onClick={() => setIsDeleteDialogOpen(true)}
					>
						Delete
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>

			{isMoveDialogOpen ? (
				<MoveCollectionDialog
					onOpenChange={setIsMoveDialogOpen}
					parentId={parentId}
					collectionId={_id}
				/>
			) : null}

			<DeleteConfirmationDialog
				description='This collection and everything inside it will be permanently deleted.'
				isPending={deleteCollection.isPending}
				onConfirm={handleDeleteCollection}
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				title='Delete collection?'
			/>
		</>
	)
}

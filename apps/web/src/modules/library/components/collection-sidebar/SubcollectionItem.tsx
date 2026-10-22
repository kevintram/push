import * as stylex from '@stylexjs/stylex'
import { Link, useNavigate } from '@tanstack/react-router'
import { FolderInput, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '~/components/ui'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

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

		overflow: 'hidden',
		display: 'block',
		// The list scrolls, so keep rows at full height instead of letting the
		// flex column squeeze them to fit.
		flexShrink: 0,

		borderRadius: radii.md,
		backgroundColor: {
			default: 'transparent',
			':hover': semanticColors.surfaceTransparentHover,
			':active': semanticColors.surfaceTransparentActive,
		},

		textDecoration: 'none',
		color: semanticColors.textPrimary,
		fontSize: fontSizes.sm,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
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
					{collectionTitle}
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem onClick={handleCreateSubcollection}>
						<Plus aria-hidden='true' size={iconSizes.sm} />
						Add subcollection
					</ContextMenuItem>
					<ContextMenuItem onClick={() => setIsMoveDialogOpen(true)}>
						<FolderInput aria-hidden='true' size={iconSizes.sm} />
						Move
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						onClick={() => setIsDeleteDialogOpen(true)}
					>
						<Trash2 aria-hidden='true' size={iconSizes.sm} />
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

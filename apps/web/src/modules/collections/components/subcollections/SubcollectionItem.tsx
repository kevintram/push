import * as stylex from '@stylexjs/stylex'
import { Link, useNavigate } from '@tanstack/react-router'
import { Folder } from 'lucide-react'
import { useCallback, useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
	FadeText,
} from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { textFadeVars } from '~/styles/textFade.stylex'
import {
	buttonSizes,
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import {
	useCreateCollection,
	useDeleteCollection,
} from '../../api/collectionQueries'
import type { Collection } from '../../types/collection.types'
import { MoveCollectionDialog } from '../MoveCollectionDialog'

const styles = stylex.create({
	badge: {
		gap: spacing.xs,
		alignItems: 'center',
		blockSize: buttonSizes.small,
		display: 'inline-flex',
		maxInlineSize: '240px',
		minInlineSize: 0,
		// The title's fade takes the end padding, per `textFade`.
		paddingInlineEnd: spacing.none,
		paddingInlineStart: spacing.md,

		borderColor: colorsSemantic.borderSubtle,
		borderRadius: radii.full,
		borderStyle: 'solid',
		borderWidth: 1,
		backgroundColor: {
			default: colorsSemantic.surfacePrimary,
			':hover': colorsSemantic.surfaceTertiary,
			':active': colorsSemantic.surfaceTertiary,
		},

		textDecoration: 'none',
		color: colorsSemantic.textPrimary,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
	},
	title: {
		[textFadeVars.size]: spacing.md,
	},
	icon: {
		color: colorsSemantic.textSecondary,
		flexShrink: 0,
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
							{...stylex.props(styles.badge)}
						/>
					}
				>
					<Folder
						aria-hidden='true'
						size={iconSizes.sm}
						{...stylex.props(styles.icon)}
					/>
					{/* The badge keeps its surface, so only the title fades. */}
					<FadeText xstyle={styles.title}>{collectionTitle}</FadeText>
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

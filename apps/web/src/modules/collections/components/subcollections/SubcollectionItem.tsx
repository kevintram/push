import * as stylex from '@stylexjs/stylex'
import { Link, useNavigate } from '@tanstack/react-router'
import { Folder } from 'lucide-react'
import { useCallback, useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { textFade } from '~/styles/textFade'
import { textFadeVars } from '~/styles/textFade.stylex'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import {
	useCreateCollection,
	useDeleteCollection,
} from '../../api/collectionQueries'
import type { Collection } from '../../types/collection.types'
import { MoveCollectionDialog } from '../MoveCollectionDialog'

const styles = stylex.create({
	badge: {
		maxInlineSize: '240px',
		minInlineSize: 0,
		// The title's fade takes the end padding, per `textFade`.
		paddingInlineEnd: spacing.none,
	},
	title: {
		[textFadeVars.size]: spacing.md,
	},
	icon: {
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
				<Tooltip>
					<ContextMenuTrigger
						render={
							<TooltipTrigger
								render={
									<Button
										variant='secondary'
										size='large'
										nativeButton={false}
										render={
											<Link
												to='/collection/$collectionId'
												params={{ collectionId: _id }}
												// Base UI marks non-native buttons as `button`.
												role='link'
											/>
										}
										xstyle={styles.badge}
									/>
								}
							/>
						}
					>
						<Folder
							aria-hidden='true'
							size={iconSizes.md}
							{...stylex.props(styles.icon)}
						/>
						{/* The badge keeps its surface, so only the title fades. */}
						<span {...stylex.props(textFade.line, styles.title)}>
							{collectionTitle}
						</span>
					</ContextMenuTrigger>
					{/* Centered on the badge, so the full title reads under it. */}
					<TooltipContent>{collectionTitle}</TooltipContent>
				</Tooltip>
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

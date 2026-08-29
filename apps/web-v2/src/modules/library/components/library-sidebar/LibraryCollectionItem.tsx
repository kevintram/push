import { PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { useDraggable, useDroppable } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'
import { Link, useMatchRoute, useNavigate } from '@tanstack/react-router'
import { FolderInput, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
	TreeItem,
	TreeItemChildren,
	TreeItemCollapsibleTrigger,
	TreeItemContent,
	TreeItemLabel,
} from '~/components/ui'
import { libraryCollectionItemColors } from '~/styles/colors/components.stylex'
import { iconSizes } from '~/styles/tokens.stylex'

import {
	useCreateCollection,
	useDeleteCollection,
} from '../../api/collectionQueries'
import { type CollectionWithChildren } from '../../types/collection.types'
import { MoveCollectionDialog } from '../MoveCollectionDialog'

const collectionPointerSensor = PointerSensor.configure({
	// sensor configuration so links can still be clicked while we do drag and drop
	activationConstraints(event) {
		if (event.pointerType === 'touch') {
			return [
				new PointerActivationConstraints.Delay({
					value: 250,
					tolerance: 5,
				}),
			]
		}

		return [new PointerActivationConstraints.Distance({ value: 6 })]
	},
})

const styles = stylex.create({
	// TODO: fix these damn color tokens
	containerDragging: {
		backgroundColor:
			libraryCollectionItemColors.containerBackgroundDragging,
	},
	containerIsDropTarget: {
		backgroundColor:
			libraryCollectionItemColors.containerBackgroundDropTarget,
	},
})

type LibraryCollectionItemProps = CollectionWithChildren & {
	/**
	 * Disables this collection and its descendants as drop targets. Parent links pass
	 * this down while their subtree is being dragged to prevent cyclic reparenting.
	 */
	disableDrop?: boolean
}

export function LibraryCollectionItem({
	_id,
	title,
	childCollections,
	parentId,
	disableDrop = false,
}: LibraryCollectionItemProps) {
	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
	const collectionTitle = title.trim() || 'Untitled'
	const navigate = useNavigate()
	const matchRoute = useMatchRoute()
	const createCollection = useCreateCollection()
	const deleteCollection = useDeleteCollection()
	const hasChildren = childCollections.length > 0

	const {
		ref: draggableElementRef,
		handleRef: draggableHandleRef,
		isDragging,
	} = useDraggable({
		id: `${_id}`,
		sensors: [collectionPointerSensor],
	})
	// Disable this subtree's drop targets when dragging
	// (otherwise we could drop subtree root onto descendant)
	const isDropDisabled = disableDrop || isDragging

	const { ref: droppableElementRef, isDropTarget } = useDroppable({
		id: `${_id}`,
		disabled: isDropDisabled,
	})

	// Combined ref for both `draggableElementRef` and `draggableHandleRef`.
	//
	// Need both because dnd-kit won't allow drag on interactive element unless
	// it uses handleRef and you just need draggableElementRef mark what you're
	// actually dragging.
	const combinedDraggableRef = useCallback(
		(element: HTMLElement | null) => {
			draggableElementRef(element)
			draggableHandleRef(element)
		},
		[draggableElementRef, draggableHandleRef],
	)

	const isActive = Boolean(
		matchRoute({
			to: '/library/$collectionId',
			params: { collectionId: _id },
			fuzzy: false,
			includeSearch: true,
		}),
	)

	const handleCreateSubcollection = useCallback(() => {
		createCollection.mutate(
			{ parentId: _id },
			{
				onSuccess: collectionId =>
					navigate({
						to: '/library/$collectionId',
						params: { collectionId },
					}),
			},
		)
	}, [navigate, createCollection, _id])

	const handleDeleteCollection = useCallback(() => {
		deleteCollection.mutate({ collectionId: _id })
	}, [_id, deleteCollection])

	return (
		<TreeItem
			ref={combinedDraggableRef}
			expandable={hasChildren}
			label={collectionTitle}
			selected={isActive}
			xstyle={[
				isDragging && styles.containerDragging,
				isDropTarget && styles.containerIsDropTarget,
			]}
		>
			<TreeItemContent ref={droppableElementRef}>
				<TreeItemCollapsibleTrigger />
				<ContextMenu>
					<ContextMenuTrigger
						render={
							<TreeItemLabel
								render={
									<Link
										to='/library/$collectionId'
										params={{ collectionId: _id }}
										activeOptions={{ exact: true }}
										aria-label={collectionTitle}
									/>
								}
							/>
						}
					>
						{collectionTitle}
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuItem onClick={handleCreateSubcollection}>
							<Plus aria-hidden='true' size={iconSizes.md} />
							Add subcollection
						</ContextMenuItem>
						<ContextMenuItem
							onClick={() => setIsMoveDialogOpen(true)}
						>
							<FolderInput
								aria-hidden='true'
								size={iconSizes.md}
							/>
							Move
						</ContextMenuItem>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={handleDeleteCollection}>
							<Trash2 aria-hidden='true' size={iconSizes.md} />
							Delete
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			</TreeItemContent>

			<TreeItemChildren>
				{childCollections.map(child => (
					<LibraryCollectionItem
						key={child._id}
						{...child}
						disableDrop={isDropDisabled}
					/>
				))}
			</TreeItemChildren>

			{isMoveDialogOpen ? (
				<MoveCollectionDialog
					onOpenChange={setIsMoveDialogOpen}
					parentId={parentId}
					collectionId={_id}
				/>
			) : null}
		</TreeItem>
	)
}

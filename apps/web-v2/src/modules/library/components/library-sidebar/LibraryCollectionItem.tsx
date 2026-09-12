import { PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { useDraggable, useDroppable } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'
import { Link, useMatchRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	TreeItem,
	TreeItemChildren,
	TreeItemCollapsibleTrigger,
	TreeItemContent,
	TreeItemLabel,
} from '~/components/ui'
import { libraryCollectionItemColors } from '~/styles/colors/components.stylex'

import {
	useCreateCollection,
	useDeleteCollection,
} from '../../api/collectionQueries'
import { type CollectionWithChildren } from '../../types/collection.types'
import { MoveCollectionDialog } from '../MoveCollectionDialog'
import { LibraryCollectionContextMenu } from './LibraryCollectionContextMenu'

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
	dropDisabled?: boolean
}

export function LibraryCollectionItem({
	_id,
	title,
	childCollections,
	parentId,
	dropDisabled = false,
}: LibraryCollectionItemProps) {
	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
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
	const isDropDisabled = dropDisabled || isDragging

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
		deleteCollection.mutate(
			{ collectionId: _id },
			{ onSuccess: () => setIsDeleteDialogOpen(false) },
		)
	}, [_id, deleteCollection])

	return (
		<TreeItem
			ref={combinedDraggableRef}
			collapsible={hasChildren}
			selected={isActive}
			xstyle={[
				isDragging && styles.containerDragging,
				isDropTarget && styles.containerIsDropTarget,
			]}
		>
			<TreeItemContent ref={droppableElementRef}>
				<TreeItemCollapsibleTrigger
					aria-label={`Toggle ${collectionTitle}`}
				/>
				<LibraryCollectionContextMenu
					trigger={
						<TreeItemLabel
							render={
								<Link
									to='/library/$collectionId'
									params={{ collectionId: _id }}
									activeOptions={{ exact: true }}
									aria-label={collectionTitle}
								/>
							}
						>
							{collectionTitle}
						</TreeItemLabel>
					}
					onCreateSubcollection={handleCreateSubcollection}
					onMove={() => setIsMoveDialogOpen(true)}
					onDelete={() => setIsDeleteDialogOpen(true)}
				/>
			</TreeItemContent>

			<TreeItemChildren>
				{childCollections.map(child => (
					<LibraryCollectionItem
						key={child._id}
						{...child}
						dropDisabled={isDropDisabled}
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

			<DeleteConfirmationDialog
				description='This collection and everything inside it will be permanently deleted.'
				isPending={deleteCollection.isPending}
				onConfirm={handleDeleteCollection}
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				title='Delete collection?'
			/>
		</TreeItem>
	)
}

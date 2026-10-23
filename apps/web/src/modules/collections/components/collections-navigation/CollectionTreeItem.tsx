import type { Id } from '@convex/_generated/dataModel'
import { PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { useDraggable, useDroppable } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'
import { Link, useMatchRoute, useNavigate } from '@tanstack/react-router'
import { type MouseEvent, useCallback, useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	TreeItem,
	TreeItemChildren,
	TreeItemCollapsibleTrigger,
	TreeItemContent,
	TreeItemLabel,
	useHoldPopoverOpen,
} from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'

import {
	useCreateCollection,
	useDeleteCollection,
} from '../../api/collectionQueries'
import { type CollectionWithChildren } from '../../types/collection.types'
import { MoveCollectionDialog } from '../MoveCollectionDialog'
import { CollectionContextMenu } from './CollectionContextMenu'

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
	// Dims the row and its subtree, since the whole branch moves with it.
	containerDragging: {
		opacity: 0.5,
	},
	containerIsDropTarget: {
		backgroundColor: colorsSemantic.surfaceTransparentHover,
	},
})

type CollectionTreeItemProps = CollectionWithChildren & {
	/** IDs of collections whose branches are currently open in the sidebar. */
	openCollectionIds: ReadonlySet<Id<'collections'>>
	/** Updates the controlled open state for this collection. */
	onCollectionOpenChange: CollectionOpenChangeHandler
	/**
	 * Disables this collection and its descendants as drop targets. Parent links pass
	 * this down while their subtree is being dragged to prevent cyclic reparenting.
	 */
	dropDisabled?: boolean
}

export type CollectionOpenChangeHandler = (
	collectionId: Id<'collections'>,
	open: boolean,
) => void

export function CollectionTreeItem({
	_id,
	title,
	childCollections,
	parentId,
	openCollectionIds,
	onCollectionOpenChange,
	dropDisabled = false,
}: CollectionTreeItemProps) {
	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	useHoldPopoverOpen(isMoveDialogOpen || isDeleteDialogOpen)
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
		data: { title: collectionTitle },
	})
	// Disable this subtree's drop targets when dragging
	// (otherwise we could drop subtree root onto descendant)
	const isDropDisabled = dropDisabled || isDragging

	const { ref: droppableElementRef, isDropTarget } = useDroppable({
		id: `${_id}`,
		disabled: isDropDisabled,
	})

	// The row is the drag element, drag handle, and drop target.
	//
	// The drag overlay takes the drag element's size, so using the row rather
	// than the whole item keeps it to one row instead of the open subtree.
	// The row is also the handle because dnd-kit only starts drags from the
	// label link when it sits inside a handle.
	const rowRef = useCallback(
		(element: HTMLElement | null) => {
			draggableElementRef(element)
			draggableHandleRef(element)
			droppableElementRef(element)
		},
		[draggableElementRef, draggableHandleRef, droppableElementRef],
	)

	const isActive = Boolean(
		matchRoute({
			to: '/collection/$collectionId',
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
						to: '/collection/$collectionId',
						params: { collectionId },
					}),
			},
		)
	}, [navigate, createCollection, _id])

	// Clicking the selected collection's label toggles it like the chevron.
	// Modified and non-primary clicks keep the link's default behavior.
	const handleLabelClick = useCallback(
		(event: MouseEvent<HTMLElement>) => {
			if (!isActive || !hasChildren) return
			if (
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey
			) {
				return
			}

			event.preventDefault()
			onCollectionOpenChange(_id, !openCollectionIds.has(_id))
		},
		[isActive, hasChildren, onCollectionOpenChange, openCollectionIds, _id],
	)

	const handleDeleteCollection = useCallback(() => {
		deleteCollection.mutate(
			{ collectionId: _id },
			{ onSuccess: () => setIsDeleteDialogOpen(false) },
		)
	}, [_id, deleteCollection])

	return (
		<TreeItem
			collapsible={hasChildren}
			open={openCollectionIds.has(_id)}
			onOpenChange={open => onCollectionOpenChange(_id, open)}
			selected={isActive}
			xstyle={[
				isDragging && styles.containerDragging,
				isDropTarget && styles.containerIsDropTarget,
			]}
		>
			<TreeItemContent ref={rowRef}>
				<TreeItemCollapsibleTrigger
					aria-label={`Toggle ${collectionTitle}`}
				/>
				<CollectionContextMenu
					trigger={
						<TreeItemLabel
							render={
								<Link
									to='/collection/$collectionId'
									params={{ collectionId: _id }}
									activeOptions={{ exact: true }}
									aria-label={collectionTitle}
								/>
							}
							onClick={handleLabelClick}
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
					<CollectionTreeItem
						key={child._id}
						{...child}
						openCollectionIds={openCollectionIds}
						onCollectionOpenChange={onCollectionOpenChange}
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

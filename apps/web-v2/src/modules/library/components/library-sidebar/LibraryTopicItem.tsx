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
import { colors } from '~/styles/colors.stylex'
import { iconSizes } from '~/styles/tokens.stylex'

import { useCreateTopic, useDeleteTopic } from '../../api/topicQueries'
import { type TopicWithChildren } from '../../types/topic.types'
import { MoveTopicDialog } from '../MoveTopicDialog'

const topicPointerSensor = PointerSensor.configure({
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
		backgroundColor: colors.navBgSurface,
	},
	containerIsDropTarget: {
		backgroundColor: colors.navBgSurfaceActive,
	},
})

type LibraryTopicItemProps = TopicWithChildren & {
	/**
	 * Disables this topic and its descendants as drop targets. Parent links pass
	 * this down while their subtree is being dragged to prevent cyclic reparenting.
	 */
	disableDrop?: boolean
}

export function LibraryTopicItem({
	_id,
	title,
	childTopics,
	parentId,
	disableDrop = false,
}: LibraryTopicItemProps) {
	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
	const topicTitle = title.trim() || 'Untitled'
	const navigate = useNavigate()
	const matchRoute = useMatchRoute()
	const createTopic = useCreateTopic()
	const deleteTopic = useDeleteTopic()
	const hasChildren = childTopics.length > 0

	const {
		ref: draggableElementRef,
		handleRef: draggableHandleRef,
		isDragging,
	} = useDraggable({
		id: `${_id}`,
		sensors: [topicPointerSensor],
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
			to: '/library/$topicId',
			params: { topicId: _id },
			fuzzy: false,
			includeSearch: true,
		}),
	)

	const handleCreateSubtopic = useCallback(() => {
		createTopic.mutate(
			{ parentId: _id },
			{
				onSuccess: topicId =>
					navigate({ to: '/library/$topicId', params: { topicId } }),
			},
		)
	}, [navigate, createTopic, _id])

	const handleDeleteTopic = useCallback(() => {
		deleteTopic.mutate({ topicId: _id })
	}, [_id, deleteTopic])

	return (
		<TreeItem
			ref={combinedDraggableRef}
			expandable={hasChildren}
			label={topicTitle}
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
										to='/library/$topicId'
										params={{ topicId: _id }}
										activeOptions={{ exact: true }}
										aria-label={topicTitle}
									/>
								}
							/>
						}
					>
						{topicTitle}
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuItem onClick={handleCreateSubtopic}>
							<Plus aria-hidden='true' size={iconSizes.md} />
							Add subtopic
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
						<ContextMenuItem onClick={handleDeleteTopic}>
							<Trash2 aria-hidden='true' size={iconSizes.md} />
							Delete
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			</TreeItemContent>

			<TreeItemChildren>
				{childTopics.map(child => (
					<LibraryTopicItem
						key={child._id}
						{...child}
						disableDrop={isDropDisabled}
					/>
				))}
			</TreeItemChildren>

			{isMoveDialogOpen ? (
				<MoveTopicDialog
					onOpenChange={setIsMoveDialogOpen}
					parentId={parentId}
					topicId={_id}
				/>
			) : null}
		</TreeItem>
	)
}

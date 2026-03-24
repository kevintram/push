import type {
	DragCancelEvent,
	DragEndEvent,
	DragOverEvent,
	DragStartEvent
} from '@dnd-kit/core'
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useDeleteTopic } from '~/features/topics/api/deleteTopic'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import { requestFocusNewTopicTitle } from '~/features/topics/createTopicIntent'
import { useTopicTree } from '~/features/topics/hooks/useTopicTree'
import { getTopicDisplayTitle } from '~/features/topics/utils/topicTree'
import { TOPIC_NAVIGATOR_DRAG_EXPAND_DELAY_MS } from './TopicNavigator.shared'
import { canReparentTopic, parseTopicDropId } from './topicNavigatorUtils'
import { useTopicNavigatorExpansionState } from './useTopicNavigatorExpansionState'
import { useTopicNavigatorScrollState } from './useTopicNavigatorScrollState'

type UseTopicNavigatorContentOptions = {
	activeTopicId?: number | null
	autoScrollActiveTopic?: boolean
	enableDragAndDrop?: boolean
	onNavigate?: () => void
}

export function useTopicNavigatorContent({
	activeTopicId,
	autoScrollActiveTopic = false,
	enableDragAndDrop = false,
	onNavigate
}: UseTopicNavigatorContentOptions) {
	const navigate = useNavigate()
	const { roots, nodeById, ancestorIdsById, isLoading, error } = useTopicTree()
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()
	const { mutateAsync: deleteTopicAsync, isPending: isDeletingTopic } =
		useDeleteTopic()
	const { mutateAsync: updateTopicAsync, isPending: isUpdatingTopic } =
		useUpdateTopic()
	const [activeDragTopicId, setActiveDragTopicId] = useState<number | null>(
		null
	)
	const [highlightedDropTopicId, setHighlightedDropTopicId] = useState<
		number | null
	>(null)
	const expandOnDragHoverTimeoutRef = useRef<number | null>(null)
	const expandOnDragHoverTopicIdRef = useRef<number | null>(null)
	const suppressNavigationRef = useRef(false)
	const [pendingDeleteTopicId, setPendingDeleteTopicId] = useState<
		number | null
	>(null)
	const activeBranchIds = useMemo(() => {
		if (activeTopicId == null) return []

		const activeAncestorIds = ancestorIdsById.get(activeTopicId) ?? []
		return [...activeAncestorIds, activeTopicId]
	}, [activeTopicId, ancestorIdsById])
	const validTopicIds = useMemo(() => new Set(nodeById.keys()), [nodeById])
	const { ensureExpanded, expandedIdSet, toggleExpanded } =
		useTopicNavigatorExpansionState({
			activeBranchIds,
			error,
			isLoading,
			validTopicIds
		})
	const { scrollViewportRef, setItemRef, stopDragAutoScroll } =
		useTopicNavigatorScrollState({
			activeBranchIds,
			activeDragTopicId,
			activeTopicId,
			autoScrollActiveTopic,
			error,
			expandedIdSet,
			isLoading,
			nodeById
		})
	const activeDragLabel =
		activeDragTopicId == null
			? null
			: getTopicDisplayTitle(
					nodeById.get(activeDragTopicId)?.title ?? '',
					nodeById.get(activeDragTopicId)?.body ?? ''
				)
	const pendingDeleteTopic =
		pendingDeleteTopicId == null ? null : nodeById.get(pendingDeleteTopicId)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8
			}
		})
	)

	const clearExpandOnDragHoverTimeout = useCallback(() => {
		if (expandOnDragHoverTimeoutRef.current !== null) {
			window.clearTimeout(expandOnDragHoverTimeoutRef.current)
			expandOnDragHoverTimeoutRef.current = null
		}
		expandOnDragHoverTopicIdRef.current = null
	}, [])

	const handleCreateSubtopic = async (parentTopicId: number) => {
		if (isCreatingTopic) return

		try {
			const created = await createTopicAsync({
				title: '',
				body: '',
				parent_id: parentTopicId
			})
			requestFocusNewTopicTitle(created.id)
			ensureExpanded(parentTopicId)
			await navigate({
				to: '/topics/$topicId',
				params: { topicId: created.id.toString() }
			})
			onNavigate?.()
		} catch {
			toast.error('Failed to create subtopic')
		}
	}

	const handleDeleteTopic = async () => {
		if (pendingDeleteTopicId == null || isDeletingTopic) return

		const topicToDelete = nodeById.get(pendingDeleteTopicId)
		if (!topicToDelete) {
			setPendingDeleteTopicId(null)
			return
		}

		const activeTopicAncestorIds =
			activeTopicId == null ? [] : (ancestorIdsById.get(activeTopicId) ?? [])
		const shouldNavigateAway =
			activeTopicId === topicToDelete.id ||
			activeTopicAncestorIds.includes(topicToDelete.id)

		try {
			await deleteTopicAsync(topicToDelete.id)
			setPendingDeleteTopicId(null)
			toast.success('Topic deleted')

			if (!shouldNavigateAway) return

			if (
				topicToDelete.parent_id != null &&
				nodeById.has(topicToDelete.parent_id)
			) {
				await navigate({
					to: '/topics/$topicId',
					params: { topicId: topicToDelete.parent_id.toString() }
				})
			} else {
				await navigate({ to: '/topics' })
			}
			onNavigate?.()
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete topic'
			)
		}
	}

	const resetDragState = () => {
		clearExpandOnDragHoverTimeout()
		stopDragAutoScroll()
		setActiveDragTopicId(null)
		setHighlightedDropTopicId(null)
		window.setTimeout(() => {
			suppressNavigationRef.current = false
		}, 0)
	}

	const handleMoveTopic = async (
		draggedTopicId: number,
		nextParentId: number | null
	) => {
		const draggedNode = nodeById.get(draggedTopicId)

		if (
			!canReparentTopic({
				draggedTopicId,
				nextParentId,
				ancestorIdsById,
				nodeById
			})
		) {
			return
		}

		const previousParentId = draggedNode?.parent_id ?? null

		try {
			await updateTopicAsync({
				id: draggedTopicId,
				parent_id: nextParentId
			})

			const handleUndoMove = async () => {
				try {
					await updateTopicAsync({
						id: draggedTopicId,
						parent_id: previousParentId
					})
					toast.success('Move undone')
				} catch (error) {
					toast.error(
						error instanceof Error ? error.message : 'Failed to undo move'
					)
				}
			}

			if (nextParentId != null) {
				ensureExpanded(nextParentId)
				const parentLabel = getTopicDisplayTitle(
					nodeById.get(nextParentId)?.title ?? '',
					nodeById.get(nextParentId)?.body ?? ''
				)
				toast.success(`Moved under ${parentLabel}`, {
					action: {
						label: 'Undo',
						onClick: () => {
							handleUndoMove().catch(() => {})
						}
					}
				})
			} else {
				toast.success('Moved to top level', {
					action: {
						label: 'Undo',
						onClick: () => {
							handleUndoMove().catch(() => {})
						}
					}
				})
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to move topic'
			)
		}
	}

	const handleDragStart = (event: DragStartEvent) => {
		const activeDropTarget = parseTopicDropId(event.active.id)
		if (activeDropTarget?.type !== 'topic') return

		suppressNavigationRef.current = true
		setActiveDragTopicId(activeDropTarget.topicId)
		setHighlightedDropTopicId(null)
	}

	const handleDragOver = (event: DragOverEvent) => {
		const activeDropTarget = parseTopicDropId(event.active.id)
		const overDropTarget =
			event.over == null ? null : parseTopicDropId(event.over.id)

		if (
			activeDropTarget?.type !== 'topic' ||
			overDropTarget?.type !== 'topic'
		) {
			clearExpandOnDragHoverTimeout()
			setHighlightedDropTopicId(null)
			return
		}

		const hoveredTopicId = overDropTarget.topicId
		const canDropIntoHoveredTopic = canReparentTopic({
			draggedTopicId: activeDropTarget.topicId,
			nextParentId: hoveredTopicId,
			ancestorIdsById,
			nodeById
		})

		setHighlightedDropTopicId(canDropIntoHoveredTopic ? hoveredTopicId : null)

		if (expandOnDragHoverTopicIdRef.current === hoveredTopicId) return

		clearExpandOnDragHoverTimeout()

		if (!canDropIntoHoveredTopic) return

		const hoveredNode = nodeById.get(hoveredTopicId)
		if (!hoveredNode || hoveredNode.children.length === 0) return
		if (expandedIdSet.has(hoveredTopicId)) return

		expandOnDragHoverTopicIdRef.current = hoveredTopicId
		expandOnDragHoverTimeoutRef.current = window.setTimeout(() => {
			ensureExpanded(hoveredTopicId)
			clearExpandOnDragHoverTimeout()
		}, TOPIC_NAVIGATOR_DRAG_EXPAND_DELAY_MS)
	}

	const handleDragEnd = (event: DragEndEvent) => {
		const activeDropTarget = parseTopicDropId(event.active.id)
		const overDropTarget =
			event.over == null ? null : parseTopicDropId(event.over.id)

		resetDragState()

		if (activeDropTarget?.type !== 'topic' || overDropTarget == null) return

		handleMoveTopic(
			activeDropTarget.topicId,
			overDropTarget.type === 'root' ? null : overDropTarget.topicId
		).catch(() => {})
	}

	const handleDragCancel = (_event: DragCancelEvent) => {
		resetDragState()
	}

	return {
		activeDragLabel,
		activeDragTopicId,
		ancestorIdsById,
		enableDragAndDrop,
		error,
		expandedIdSet,
		handleConfirmDeleteTopic: () => {
			handleDeleteTopic().catch(() => {})
		},
		handleCreateSubtopic: (topicId: number) => {
			handleCreateSubtopic(topicId).catch(() => {})
		},
		handleDialogOpenChange: (open: boolean) => {
			if (!open) setPendingDeleteTopicId(null)
		},
		handleDragCancel,
		handleDragEnd,
		handleDragOver,
		handleDragStart,
		highlightedDropTopicId,
		isDeletingTopic,
		isLoading,
		isUpdatingTopic,
		nodeById,
		onNavigate,
		pendingDeleteTopic,
		pendingDeleteTopicId,
		roots,
		scrollViewportRef,
		sensors,
		setItemRef,
		setPendingDeleteTopicId,
		suppressNavigationRef,
		toggleExpanded
	}
}

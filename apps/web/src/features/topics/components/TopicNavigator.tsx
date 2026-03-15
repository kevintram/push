import {
	DndContext,
	type DragCancelEvent,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	pointerWithin,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { Link, useNavigate } from '@tanstack/react-router'
import {
	AlertTriangle,
	ChevronRight,
	House,
	Library,
	Plus,
	Trash2
} from 'lucide-react'
import type {
	CSSProperties,
	MutableRefObject,
	PointerEvent as ReactPointerEvent
} from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger
} from '~/components/ui/context-menu'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { Separator } from '~/components/ui/separator'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from '~/components/ui/sheet'
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarProvider
} from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'
import { useCreateTopic } from '../api/createTopic'
import { useDeleteTopic } from '../api/deleteTopic'
import { useUpdateTopic } from '../api/updateTopic'
import { requestFocusNewTopicTitle } from '../createTopicIntent'
import { useTopicTree } from '../hooks/useTopicTree'
import { getTopicDisplayTitle, type TopicTreeNode } from '../utils/topicTree'
import {
	canReparentTopic,
	createRootDropId,
	createTopicDropId,
	mergeExpandedTopicIds,
	parseTopicDropId
} from './topicNavigatorUtils'

const TOPIC_NAVIGATOR_MIN_WIDTH_PX = 12 * 16
const TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX = 18 * 16
const TOPIC_NAVIGATOR_MAX_WIDTH_PX = 30 * 16
const TOPIC_NAVIGATOR_WIDTH_STORAGE_KEY = 'topic-navigator-width'
const TOPIC_NAVIGATOR_EXPANDED_IDS_STORAGE_KEY = 'topic-navigator-expanded-ids'
const TOPIC_NAVIGATOR_DRAG_EXPAND_DELAY_MS = 650
const TOPIC_NAVIGATOR_DRAG_SCROLL_EDGE_THRESHOLD_PX = 56
const TOPIC_NAVIGATOR_DRAG_SCROLL_MAX_STEP_PX = 14
const TOPIC_NAVIGATOR_TREE_INDENT_REM = 0.75

function areNumberArraysEqual(left: Array<number>, right: Array<number>) {
	if (left.length !== right.length) return false

	for (let index = 0; index < left.length; index += 1) {
		if (left[index] !== right[index]) return false
	}

	return true
}

function clampTopicNavigatorWidth(width: number) {
	return Math.min(
		Math.max(width, TOPIC_NAVIGATOR_MIN_WIDTH_PX),
		TOPIC_NAVIGATOR_MAX_WIDTH_PX
	)
}

function getStoredTopicNavigatorWidth() {
	if (typeof window === 'undefined') return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX
	if (typeof window.localStorage?.getItem !== 'function') {
		return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX
	}

	const storedWidth = window.localStorage.getItem(
		TOPIC_NAVIGATOR_WIDTH_STORAGE_KEY
	)

	if (storedWidth == null) return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX

	const parsedWidth = Number.parseFloat(storedWidth)
	if (Number.isNaN(parsedWidth)) return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX

	return clampTopicNavigatorWidth(parsedWidth)
}

function getStoredExpandedTopicIds() {
	if (typeof window === 'undefined') return []
	if (typeof window.localStorage?.getItem !== 'function') return []

	const storedExpandedIds = window.localStorage.getItem(
		TOPIC_NAVIGATOR_EXPANDED_IDS_STORAGE_KEY
	)

	if (storedExpandedIds == null) return []

	try {
		const parsedValue = JSON.parse(storedExpandedIds)
		if (!Array.isArray(parsedValue)) return []

		return parsedValue.filter(
			(value): value is number =>
				typeof value === 'number' && Number.isInteger(value)
		)
	} catch {
		return []
	}
}

function TopicNavigatorRootDropZone({
	activeDragTopicId,
	ancestorIdsById,
	className,
	id,
	nodeById
}: {
	activeDragTopicId: number | null
	ancestorIdsById: Map<number, Array<number>>
	className?: string
	id: string
	nodeById: Map<number, TopicTreeNode>
}) {
	const canDropToRoot =
		activeDragTopicId != null &&
		canReparentTopic({
			draggedTopicId: activeDragTopicId,
			nextParentId: null,
			ancestorIdsById,
			nodeById
		})

	const { isOver, setNodeRef } = useDroppable({
		id,
		disabled: !canDropToRoot
	})

	if (activeDragTopicId == null) return null

	return (
		<div
			className={cn(
				'rounded-md border border-dashed px-3 py-2 text-muted-foreground text-xs transition-colors',
				className,
				canDropToRoot && 'border-border/80 bg-muted/30',
				isOver &&
					canDropToRoot &&
					'border-foreground/30 bg-accent text-foreground'
			)}
			ref={setNodeRef}
		>
			Move to top level
		</div>
	)
}

function TopicNavigatorItem(props: {
	node: TopicTreeNode
	activeTopicId?: number | null
	activeDragTopicId: number | null
	ancestorIdsById: Map<number, Array<number>>
	expandedIdSet: Set<number>
	highlightedDropTopicId: number | null
	isDragAndDropEnabled: boolean
	isUpdatingTopic: boolean
	nodeById: Map<number, TopicTreeNode>
	onNavigate?: () => void
	onToggleExpanded: (topicId: number) => void
	onCreateSubtopic: (topicId: number) => void
	onRequestDeleteTopic: (topicId: number) => void
	suppressNavigationRef: MutableRefObject<boolean>
	setItemRef: (topicId: number, element: HTMLLIElement | null) => void
}) {
	const {
		node,
		activeTopicId,
		activeDragTopicId,
		ancestorIdsById,
		expandedIdSet,
		highlightedDropTopicId,
		isDragAndDropEnabled,
		isUpdatingTopic,
		nodeById,
		onNavigate,
		onCreateSubtopic,
		onRequestDeleteTopic,
		onToggleExpanded,
		suppressNavigationRef,
		setItemRef
	} = props

	const hasChildren = node.children.length > 0
	const isExpanded = expandedIdSet.has(node.id)
	const isActive = node.id === activeTopicId
	const label = getTopicDisplayTitle(node.title, node.body)
	const canDropIntoNode =
		activeDragTopicId != null &&
		canReparentTopic({
			draggedTopicId: activeDragTopicId,
			nextParentId: node.id,
			ancestorIdsById,
			nodeById
		})
	const isDropSubtreeHighlighted =
		highlightedDropTopicId === node.id && canDropIntoNode

	const {
		attributes,
		listeners,
		setNodeRef: setDraggableNodeRef,
		isDragging
	} = useDraggable({
		id: createTopicDropId(node.id),
		data: {
			topicId: node.id
		},
		disabled: !isDragAndDropEnabled || isUpdatingTopic
	})

	const { setNodeRef: setDroppableNodeRef } = useDroppable({
		id: createTopicDropId(node.id),
		disabled: !canDropIntoNode
	})

	return (
		<ContextMenu>
			<li ref={element => setItemRef(node.id, element)}>
				<div
					className={cn(
						'rounded-lg transition-colors',
						isDropSubtreeHighlighted &&
							'bg-accent text-foreground ring-1 ring-border'
					)}
				>
					<ContextMenuTrigger
						{...(isDragAndDropEnabled && !isUpdatingTopic
							? { ...attributes, ...listeners }
							: {})}
						className={cn(
							'group/topic-row flex select-none items-center gap-1 rounded-md pr-1 transition-colors',
							isDragAndDropEnabled && !isUpdatingTopic && 'cursor-grab',
							isActive && 'bg-accent/70 text-foreground',
							!(isActive || isDropSubtreeHighlighted) && 'hover:bg-muted/50',
							isDragging && 'cursor-grabbing opacity-15'
						)}
						ref={element => {
							setDraggableNodeRef(element)
							setDroppableNodeRef(element)
						}}
					>
						{hasChildren ? (
							<Button
								aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${label}`}
								className='h-6 w-6 shrink-0'
								onClick={event => {
									event.stopPropagation()
									onToggleExpanded(node.id)
								}}
								size='icon-sm'
								type='button'
								variant='ghost'
							>
								<ChevronRight
									className={cn(
										'h-4 w-4 transition-transform',
										isExpanded && 'rotate-90'
									)}
								/>
							</Button>
						) : null}
						<Link
							aria-current={isActive ? 'page' : undefined}
							className={cn(
								'min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-sm underline-offset-4 transition-colors hover:underline',
								!hasChildren && 'ml-1',
								isActive && 'font-medium text-foreground',
								!isActive && isDropSubtreeHighlighted && 'text-foreground',
								!(isActive || isDropSubtreeHighlighted) &&
									'text-muted-foreground hover:text-foreground'
							)}
							onClick={event => {
								if (suppressNavigationRef.current) {
									event.preventDefault()
									event.stopPropagation()
									return
								}

								onNavigate?.()
							}}
							params={{ topicId: node.id.toString() }}
							to='/topics/$topicId'
						>
							{label}
						</Link>
					</ContextMenuTrigger>
					<ContextMenuContent align='start' side='right' sideOffset={6}>
						<ContextMenuItem
							disabled={isUpdatingTopic}
							onClick={() => {
								onCreateSubtopic(node.id)
							}}
						>
							<Plus className='h-4 w-4' />
							New topic
						</ContextMenuItem>
						<ContextMenuItem
							disabled={isUpdatingTopic}
							onClick={() => {
								onRequestDeleteTopic(node.id)
							}}
							variant='destructive'
						>
							<Trash2 className='h-4 w-4' />
							Delete
						</ContextMenuItem>
					</ContextMenuContent>

					{hasChildren && isExpanded ? (
						<ul
							className='mt-1 space-y-1 border-border/60 border-l'
							style={{
								marginLeft: `${TOPIC_NAVIGATOR_TREE_INDENT_REM}rem`,
								paddingLeft: `${TOPIC_NAVIGATOR_TREE_INDENT_REM}rem`
							}}
						>
							{node.children.map(childNode => (
								<TopicNavigatorItem
									activeDragTopicId={activeDragTopicId}
									activeTopicId={activeTopicId}
									ancestorIdsById={ancestorIdsById}
									expandedIdSet={expandedIdSet}
									highlightedDropTopicId={highlightedDropTopicId}
									isDragAndDropEnabled={isDragAndDropEnabled}
									isUpdatingTopic={isUpdatingTopic}
									key={childNode.id}
									node={childNode}
									nodeById={nodeById}
									onCreateSubtopic={onCreateSubtopic}
									onNavigate={onNavigate}
									onRequestDeleteTopic={onRequestDeleteTopic}
									onToggleExpanded={onToggleExpanded}
									setItemRef={setItemRef}
									suppressNavigationRef={suppressNavigationRef}
								/>
							))}
						</ul>
					) : null}
				</div>
			</li>
		</ContextMenu>
	)
}

function TopicNavigatorContent({
	activeTopicId,
	enableDragAndDrop = false,
	onNavigate
}: {
	activeTopicId?: number | null
	enableDragAndDrop?: boolean
	onNavigate?: () => void
}) {
	const navigate = useNavigate()
	const { roots, nodeById, ancestorIdsById, isLoading, error } = useTopicTree()
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()
	const { mutateAsync: deleteTopicAsync, isPending: isDeletingTopic } =
		useDeleteTopic()
	const { mutateAsync: updateTopicAsync, isPending: isUpdatingTopic } =
		useUpdateTopic()
	const [expandedIds, setExpandedIds] = useState(getStoredExpandedTopicIds)
	const [activeDragTopicId, setActiveDragTopicId] = useState<number | null>(
		null
	)
	const [highlightedDropTopicId, setHighlightedDropTopicId] = useState<
		number | null
	>(null)
	const expandOnDragHoverTimeoutRef = useRef<number | null>(null)
	const expandOnDragHoverTopicIdRef = useRef<number | null>(null)
	const suppressNavigationRef = useRef(false)
	const itemElementsRef = useRef(new Map<number, HTMLLIElement>())
	const scrollContainerRef = useRef<HTMLElement | null>(null)
	const pendingScrollTopicIdRef = useRef<number | null>(activeTopicId ?? null)
	const activeItemScrollFrameRef = useRef<number | null>(null)
	const dragPointerPositionRef = useRef<{ x: number; y: number } | null>(null)
	const dragScrollFrameRef = useRef<number | null>(null)
	const [pendingDeleteTopicId, setPendingDeleteTopicId] = useState<
		number | null
	>(null)
	const activeBranchIds = useMemo(() => {
		if (activeTopicId == null) return []

		const activeAncestorIds = ancestorIdsById.get(activeTopicId) ?? []
		return [...activeAncestorIds, activeTopicId]
	}, [activeTopicId, ancestorIdsById])
	const validTopicIds = useMemo(() => new Set(nodeById.keys()), [nodeById])
	const expandedIdSet = useMemo(() => new Set(expandedIds), [expandedIds])
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
		if (expandOnDragHoverTimeoutRef.current != null) {
			window.clearTimeout(expandOnDragHoverTimeoutRef.current)
			expandOnDragHoverTimeoutRef.current = null
		}
		expandOnDragHoverTopicIdRef.current = null
	}, [])

	const stopDragAutoScroll = useCallback(() => {
		if (dragScrollFrameRef.current != null) {
			window.cancelAnimationFrame(dragScrollFrameRef.current)
			dragScrollFrameRef.current = null
		}
		dragPointerPositionRef.current = null
	}, [])

	useEffect(() => {
		if (typeof window === 'undefined') return
		if (typeof window.localStorage?.setItem !== 'function') return

		window.localStorage.setItem(
			TOPIC_NAVIGATOR_EXPANDED_IDS_STORAGE_KEY,
			JSON.stringify(expandedIds)
		)
	}, [expandedIds])

	useEffect(() => {
		if (isLoading || error) return

		setExpandedIds(previousExpandedIds => {
			const nextExpandedIds = mergeExpandedTopicIds({
				expandedIds: previousExpandedIds,
				idsToExpand: activeBranchIds,
				validTopicIds
			})

			return areNumberArraysEqual(previousExpandedIds, nextExpandedIds)
				? previousExpandedIds
				: nextExpandedIds
		})
	}, [activeBranchIds, error, isLoading, validTopicIds])

	useEffect(() => {
		pendingScrollTopicIdRef.current = activeTopicId ?? null

		if (activeItemScrollFrameRef.current != null) {
			window.cancelAnimationFrame(activeItemScrollFrameRef.current)
			activeItemScrollFrameRef.current = null
		}
	}, [activeTopicId])

	useEffect(() => {
		return () => {
			clearExpandOnDragHoverTimeout()
			stopDragAutoScroll()

			if (activeItemScrollFrameRef.current != null) {
				window.cancelAnimationFrame(activeItemScrollFrameRef.current)
				activeItemScrollFrameRef.current = null
			}
		}
	}, [clearExpandOnDragHoverTimeout, stopDragAutoScroll])

	useEffect(() => {
		if (activeDragTopicId == null) {
			stopDragAutoScroll()
			return
		}

		const stepAutoScroll = () => {
			dragScrollFrameRef.current = window.requestAnimationFrame(stepAutoScroll)

			const scrollContainer = scrollContainerRef.current
			const pointerPosition = dragPointerPositionRef.current

			if (!(scrollContainer && pointerPosition)) return

			const containerRect = scrollContainer.getBoundingClientRect()
			if (
				pointerPosition.x < containerRect.left ||
				pointerPosition.x > containerRect.right
			) {
				return
			}

			let scrollDelta = 0

			if (
				pointerPosition.y <
				containerRect.top + TOPIC_NAVIGATOR_DRAG_SCROLL_EDGE_THRESHOLD_PX
			) {
				scrollDelta = -Math.ceil(
					(containerRect.top +
						TOPIC_NAVIGATOR_DRAG_SCROLL_EDGE_THRESHOLD_PX -
						pointerPosition.y) /
						6
				)
			} else if (
				pointerPosition.y >
				containerRect.bottom - TOPIC_NAVIGATOR_DRAG_SCROLL_EDGE_THRESHOLD_PX
			) {
				scrollDelta = Math.ceil(
					(pointerPosition.y -
						(containerRect.bottom -
							TOPIC_NAVIGATOR_DRAG_SCROLL_EDGE_THRESHOLD_PX)) /
						6
				)
			}

			if (scrollDelta === 0) return

			const clampedScrollDelta = Math.max(
				-TOPIC_NAVIGATOR_DRAG_SCROLL_MAX_STEP_PX,
				Math.min(scrollDelta, TOPIC_NAVIGATOR_DRAG_SCROLL_MAX_STEP_PX)
			)
			scrollContainer.scrollTop += clampedScrollDelta
		}

		const handlePointerMove = (event: PointerEvent) => {
			dragPointerPositionRef.current = {
				x: event.clientX,
				y: event.clientY
			}
		}

		window.addEventListener('pointermove', handlePointerMove)
		dragScrollFrameRef.current = window.requestAnimationFrame(stepAutoScroll)

		return () => {
			window.removeEventListener('pointermove', handlePointerMove)
			stopDragAutoScroll()
		}
	}, [activeDragTopicId, stopDragAutoScroll])

	const toggleExpanded = (topicId: number) => {
		setExpandedIds(previousExpandedIds =>
			previousExpandedIds.includes(topicId)
				? previousExpandedIds.filter(id => id !== topicId)
				: [...previousExpandedIds, topicId]
		)
	}

	const handleCreateSubtopic = async (parentTopicId: number) => {
		if (isCreatingTopic) return

		try {
			const created = await createTopicAsync({
				title: '',
				body: '',
				parent_id: parentTopicId
			})
			requestFocusNewTopicTitle(created.id)
			setExpandedIds(previousExpandedIds =>
				previousExpandedIds.includes(parentTopicId)
					? previousExpandedIds
					: [...previousExpandedIds, parentTopicId]
			)
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
				setExpandedIds(previousExpandedIds =>
					previousExpandedIds.includes(nextParentId)
						? previousExpandedIds
						: [...previousExpandedIds, nextParentId]
				)
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
			setExpandedIds(previousExpandedIds =>
				previousExpandedIds.includes(hoveredTopicId)
					? previousExpandedIds
					: [...previousExpandedIds, hoveredTopicId]
			)
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

	if (isLoading) {
		return <LoadingSpinner containerClassName='min-h-32' />
	}

	if (error) {
		return (
			<p className='px-3 py-2 text-muted-foreground text-sm'>
				Failed to load topic hierarchy.
			</p>
		)
	}

	if (roots.length === 0) {
		return (
			<p className='px-3 py-2 text-muted-foreground text-sm'>No topics yet.</p>
		)
	}

	return (
		<DndContext
			collisionDetection={pointerWithin}
			onDragCancel={handleDragCancel}
			onDragEnd={handleDragEnd}
			onDragOver={handleDragOver}
			onDragStart={handleDragStart}
			sensors={enableDragAndDrop ? sensors : undefined}
		>
			<nav aria-label='Topic hierarchy' className='space-y-2'>
				{enableDragAndDrop ? (
					<TopicNavigatorRootDropZone
						activeDragTopicId={activeDragTopicId}
						ancestorIdsById={ancestorIdsById}
						className='mb-1'
						id={createRootDropId('top')}
						nodeById={nodeById}
					/>
				) : null}
				<ul
					className='space-y-1'
					ref={element => {
						scrollContainerRef.current =
							element?.closest('[data-slot="sidebar-content"]') ?? null
					}}
				>
					{roots.map(rootNode => (
						<TopicNavigatorItem
							activeDragTopicId={activeDragTopicId}
							activeTopicId={activeTopicId}
							ancestorIdsById={ancestorIdsById}
							expandedIdSet={expandedIdSet}
							highlightedDropTopicId={highlightedDropTopicId}
							isDragAndDropEnabled={enableDragAndDrop}
							isUpdatingTopic={isUpdatingTopic}
							key={rootNode.id}
							node={rootNode}
							nodeById={nodeById}
							onCreateSubtopic={topicId => {
								handleCreateSubtopic(topicId).catch(() => {})
							}}
							onNavigate={onNavigate}
							onRequestDeleteTopic={setPendingDeleteTopicId}
							onToggleExpanded={toggleExpanded}
							setItemRef={(topicId, element) => {
								if (element == null) {
									itemElementsRef.current.delete(topicId)
									return
								}

								itemElementsRef.current.set(topicId, element)

								if (pendingScrollTopicIdRef.current !== topicId) return

								if (activeItemScrollFrameRef.current != null) {
									window.cancelAnimationFrame(activeItemScrollFrameRef.current)
								}

								activeItemScrollFrameRef.current = window.requestAnimationFrame(
									() => {
										element.scrollIntoView({
											block: 'nearest'
										})
										pendingScrollTopicIdRef.current = null
										activeItemScrollFrameRef.current = null
									}
								)
							}}
							suppressNavigationRef={suppressNavigationRef}
						/>
					))}
				</ul>
				{enableDragAndDrop ? (
					<TopicNavigatorRootDropZone
						activeDragTopicId={activeDragTopicId}
						ancestorIdsById={ancestorIdsById}
						className='mt-1'
						id={createRootDropId('bottom')}
						nodeById={nodeById}
					/>
				) : null}
			</nav>
			<DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
				{activeDragLabel ? (
					<Badge
						className='max-w-72 truncate bg-background/95 px-2.5 py-1 text-sm shadow-lg backdrop-blur-xs'
						variant='outline'
					>
						{activeDragLabel}
					</Badge>
				) : null}
			</DragOverlay>
			<AlertDialog
				onOpenChange={open => {
					if (!open) setPendingDeleteTopicId(null)
				}}
				open={pendingDeleteTopicId != null}
			>
				<AlertDialogContent size='sm'>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<AlertTriangle className='h-5 w-5' />
						</AlertDialogMedia>
						<AlertDialogTitle>Delete topic?</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingDeleteTopic
								? `Delete ${getTopicDisplayTitle(
										pendingDeleteTopic.title,
										pendingDeleteTopic.body
									)} and all of its subtopics, review cards, and reviews? This action cannot be undone.`
								: 'This action cannot be undone.'}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							buttonClassName='w-full sm:w-auto'
							disabled={isDeletingTopic}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							buttonClassName='w-full sm:w-auto'
							disabled={isDeletingTopic}
							onClick={() => {
								handleDeleteTopic().catch(() => {})
							}}
						>
							{isDeletingTopic ? 'Deleting...' : 'Delete topic'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</DndContext>
	)
}

function TopicNavigatorPanel({
	activeTopicId,
	enableDragAndDrop = false,
	onNavigate
}: {
	activeTopicId?: number | null
	enableDragAndDrop?: boolean
	onNavigate?: () => void
}) {
	const navigate = useNavigate()
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()

	const handleCreateTopic = async () => {
		if (isCreatingTopic) return

		try {
			const created = await createTopicAsync({
				title: '',
				body: ''
			})
			requestFocusNewTopicTitle(created.id)
			await navigate({
				to: '/topics/$topicId',
				params: { topicId: created.id.toString() }
			})
			onNavigate?.()
		} catch {
			toast.error('Failed to create topic')
		}
	}

	return (
		<>
			<SidebarHeader className='border-sidebar-border/70'>
				<div className='flex items-center gap-1'>
					<Button
						className='flex-1 justify-start'
						nativeButton={false}
						onClick={() => onNavigate?.()}
						render={<Link to='/topics' />}
						variant='ghost'
					>
						<House className='h-4 w-4' />
						Home
					</Button>
					<Button
						aria-label='Create new topic'
						disabled={isCreatingTopic}
						onClick={() => {
							handleCreateTopic().catch(() => {})
						}}
						size='icon-sm'
						variant='ghost'
					>
						<Plus className='h-4 w-4' />
					</Button>
				</div>
				<Separator className='mr-12 w-auto!' />
			</SidebarHeader>
			<SidebarContent className='p-2'>
				<TopicNavigatorContent
					activeTopicId={activeTopicId}
					enableDragAndDrop={enableDragAndDrop}
					onNavigate={onNavigate}
				/>
			</SidebarContent>
		</>
	)
}

export function TopicNavigatorRail({
	activeTopicId,
	className
}: {
	activeTopicId?: number | null
	className?: string
}) {
	const [sidebarWidth, setSidebarWidth] = useState(getStoredTopicNavigatorWidth)
	const [isResizing, setIsResizing] = useState(false)

	useEffect(() => {
		if (typeof window === 'undefined') return
		if (typeof window.localStorage?.setItem !== 'function') return

		window.localStorage.setItem(
			TOPIC_NAVIGATOR_WIDTH_STORAGE_KEY,
			sidebarWidth.toString()
		)
	}, [sidebarWidth])

	useEffect(() => {
		if (typeof document === 'undefined') return

		if (!isResizing) return

		document.body.classList.add('cursor-col-resize', 'select-none')

		return () => {
			document.body.classList.remove('cursor-col-resize', 'select-none')
		}
	}, [isResizing])

	const handleResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
		event.preventDefault()

		const startX = event.clientX
		const startWidth = sidebarWidth

		setIsResizing(true)

		const handlePointerMove = (moveEvent: PointerEvent) => {
			const nextWidth = clampTopicNavigatorWidth(
				startWidth + (moveEvent.clientX - startX)
			)
			setSidebarWidth(nextWidth)
		}

		const handlePointerUp = () => {
			setIsResizing(false)
			window.removeEventListener('pointermove', handlePointerMove)
			window.removeEventListener('pointerup', handlePointerUp)
		}

		window.addEventListener('pointermove', handlePointerMove)
		window.addEventListener('pointerup', handlePointerUp)
	}

	return (
		<SidebarProvider
			className={cn(
				'relative hidden h-full min-h-0 w-auto flex-none md:flex',
				className
			)}
			style={{ '--sidebar-width': `${sidebarWidth}px` } as CSSProperties}
		>
			<Sidebar
				className='h-full border-sidebar-border/70 border-r bg-background'
				collapsible='none'
			>
				<TopicNavigatorPanel
					activeTopicId={activeTopicId}
					enableDragAndDrop={true}
				/>
			</Sidebar>
			<div
				aria-hidden='true'
				className='absolute top-0 right-0 z-20 hidden h-full w-3 translate-x-1/2 cursor-col-resize items-center justify-center md:flex'
				onPointerDown={handleResizeStart}
			>
				<div
					className={cn(
						'h-16 w-px rounded-full bg-border/70 transition-colors',
						isResizing && 'bg-foreground/60'
					)}
				/>
			</div>
		</SidebarProvider>
	)
}

export function TopicNavigatorSheet({
	activeTopicId,
	className
}: {
	activeTopicId?: number | null
	className?: string
}) {
	const [open, setOpen] = useState(false)

	return (
		<Sheet onOpenChange={setOpen} open={open}>
			<SheetTrigger
				render={
					<Button
						className={cn('md:hidden', className)}
						size='sm'
						variant='outline'
					/>
				}
			>
				<Library className='h-4 w-4' />
				Hierarchy
			</SheetTrigger>
			<SheetContent className='w-full sm:max-w-sm' side='right'>
				<SheetHeader>
					<SheetTitle>Topic hierarchy</SheetTitle>
					<SheetDescription>
						Browse the full topic and subtopic tree.
					</SheetDescription>
				</SheetHeader>
				<div className='min-h-0 flex-1 overflow-auto px-4 pb-4'>
					<TopicNavigatorPanel
						activeTopicId={activeTopicId}
						onNavigate={() => setOpen(false)}
					/>
				</div>
			</SheetContent>
		</Sheet>
	)
}

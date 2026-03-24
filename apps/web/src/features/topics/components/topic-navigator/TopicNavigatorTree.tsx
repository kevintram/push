import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Link } from '@tanstack/react-router'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import type { MutableRefObject } from 'react'

import { Button } from '~/components/ui/button'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger
} from '~/components/ui/context-menu'
import { cn } from '~/lib/utils'
import { TOPIC_DETAIL_INTENT_PRELOAD_DELAY } from '~/features/topics/hooks/usePrefetchTopicDetail'
import {
	getTopicDisplayTitle,
	type TopicTreeNode
} from '~/features/topics/utils/topicTree'
import { TOPIC_NAVIGATOR_TREE_INDENT_REM } from './TopicNavigator.shared'
import { canReparentTopic, createTopicDropId } from './topicNavigatorUtils'

export type TopicNavigatorItemProps = {
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
}

export function TopicNavigatorRootDropZone({
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

export function TopicNavigatorItem(props: TopicNavigatorItemProps) {
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
	const isActiveSubtreeHighlighted = isActive
	const isSubtreeHighlighted =
		isDropSubtreeHighlighted || isActiveSubtreeHighlighted

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
						isActiveSubtreeHighlighted &&
							'bg-accent/45 text-foreground ring-1 ring-border/60',
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
							!isSubtreeHighlighted && 'hover:bg-muted/50',
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
								!isActive && isSubtreeHighlighted && 'text-foreground',
								!(isActive || isSubtreeHighlighted) &&
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
							preload='intent'
							preloadDelay={TOPIC_DETAIL_INTENT_PRELOAD_DELAY}
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

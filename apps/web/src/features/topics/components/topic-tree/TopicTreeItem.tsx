import { useDraggable, useDroppable } from '@dnd-kit/core'
import { ChevronRight, ExternalLink, Plus, Trash2 } from 'lucide-react'
import type { MutableRefObject, ReactNode } from 'react'
import { Button } from '~/components/ui/button'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger
} from '~/components/ui/context-menu'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'
import { getTopicDisplayTitle } from '~/features/topics/utils/topicTree'
import { cn } from '~/lib/utils'
import {
	canReparentTopic,
	createTopicDropId
} from '../topic-navigator/topicNavigatorUtils'

const TOPIC_TREE_GUIDE_OFFSET_REM = 0.5625
const TOPIC_TREE_INDENT_REM = 0.1875

type TopicTreeHighlightAppearance = 'container' | 'text-only'

interface TopicTreeItemRenderProps {
	className: string
	isActive: boolean
	isSubtreeHighlighted: boolean
	label: string
	node: TopicTreeNode
	suppressSelectionRef: MutableRefObject<boolean>
}

export interface TopicTreeItemProps {
	activeDragTopicId: number | null
	activeTopicId?: number | null
	ancestorIdsById: Map<number, Array<number>>
	expandedIdSet: Set<number>
	highlightedDropTopicId: number | null
	highlightedTopicIds?: ReadonlySet<number>
	highlightAppearance?: TopicTreeHighlightAppearance
	hoveredTopicId?: number | null
	isDragAndDropEnabled: boolean
	isUpdatingTopic: boolean
	node: TopicTreeNode
	nodeById: Map<number, TopicTreeNode>
	onCreateSubtopic: (topicId: number) => void
	onHoverTopicChange?: (topicId: number | null) => void
	onOpenTopic?: (topicId: number) => void
	onRequestDeleteTopic: (topicId: number) => void
	onToggleExpanded: (topicId: number) => void
	renderPrimaryAction: (props: TopicTreeItemRenderProps) => ReactNode
	setItemRef?: (topicId: number, element: HTMLLIElement | null) => void
	suppressSelectionRef: MutableRefObject<boolean>
}

export function TopicTreeItem({
	activeDragTopicId,
	activeTopicId,
	ancestorIdsById,
	expandedIdSet,
	highlightedDropTopicId,
	highlightedTopicIds,
	highlightAppearance = 'container',
	hoveredTopicId,
	isDragAndDropEnabled,
	isUpdatingTopic,
	node,
	nodeById,
	onCreateSubtopic,
	onHoverTopicChange,
	onOpenTopic,
	onRequestDeleteTopic,
	onToggleExpanded,
	renderPrimaryAction,
	setItemRef,
	suppressSelectionRef
}: TopicTreeItemProps) {
	const hasChildren = node.children.length > 0
	const isExpanded = expandedIdSet.has(node.id)
	const isActive =
		node.id === activeTopicId || highlightedTopicIds?.has(node.id) === true
	const label = getTopicDisplayTitle(node.title, node.body)
	const canDropIntoNode =
		activeDragTopicId !== null &&
		canReparentTopic({
			draggedTopicId: activeDragTopicId,
			nextParentId: node.id,
			ancestorIdsById,
			nodeById
		})
	const isDropSubtreeHighlighted =
		highlightedDropTopicId === node.id && canDropIntoNode
	const isHoverSubtreeHighlighted = hoveredTopicId === node.id
	const isSubtreeHighlighted =
		isDropSubtreeHighlighted || isHoverSubtreeHighlighted || isActive

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

	const triggerProps =
		isDragAndDropEnabled && !isUpdatingTopic
			? { ...attributes, ...listeners }
			: {}

	const row = (
		<div
			className={cn(
				'group/topic-row flex min-h-7 select-none items-center gap-0 rounded-md pr-0.5 transition-colors',
				isDragAndDropEnabled && !isUpdatingTopic && 'cursor-grab',
				isDragging && 'cursor-grabbing opacity-15',
				(highlightAppearance === 'text-only' || !isSubtreeHighlighted) &&
					'hover:bg-muted/50'
			)}
		>
			{hasChildren ? (
				<Button
					aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${label}`}
					className='h-5 w-5 shrink-0'
					onClick={event => {
						event.stopPropagation()
						onToggleExpanded(node.id)
					}}
					size='icon-xs'
					type='button'
					variant='ghost'
				>
					<ChevronRight
						aria-hidden='true'
						className={cn(
							'h-3.5 w-3.5 shrink-0 text-muted-foreground/70 transition-transform',
							isExpanded && 'rotate-90'
						)}
					/>
				</Button>
			) : null}
			{renderPrimaryAction({
				className: cn(
					'min-w-0 flex-1 truncate rounded-md py-1 text-sm underline-offset-4 transition-colors hover:underline',
					hasChildren ? 'pr-1.5 pl-0.5' : 'ml-1 px-1.5',
					isActive && 'font-medium text-foreground',
					!isActive && isSubtreeHighlighted && 'text-foreground',
					!(isActive || isSubtreeHighlighted) &&
						'text-muted-foreground hover:text-foreground'
				),
				isActive,
				isSubtreeHighlighted,
				label,
				node,
				suppressSelectionRef
			})}
		</div>
	)

	return (
		<ContextMenu>
			<li ref={element => setItemRef?.(node.id, element)}>
				<div
					className={cn(
						highlightAppearance === 'container' &&
							'rounded-lg transition-colors',
						highlightAppearance === 'container' &&
							(isActive || isHoverSubtreeHighlighted) &&
							'bg-accent/45 text-foreground ring-1 ring-border/60',
						highlightAppearance === 'container' &&
							isDropSubtreeHighlighted &&
							'bg-accent text-foreground ring-1 ring-border'
					)}
				>
					<ContextMenuTrigger
						{...triggerProps}
						className='rounded-md'
						onPointerEnter={() => {
							if (activeDragTopicId !== null) return
							onHoverTopicChange?.(node.id)
						}}
						onPointerLeave={() => {
							if (activeDragTopicId !== null) return
							onHoverTopicChange?.(null)
						}}
						ref={element => {
							setDraggableNodeRef(element)
							setDroppableNodeRef(element)
						}}
					>
						{row}
					</ContextMenuTrigger>
					<ContextMenuContent align='start' side='right' sideOffset={6}>
						{onOpenTopic ? (
							<ContextMenuItem
								disabled={isUpdatingTopic}
								onClick={() => {
									onOpenTopic(node.id)
								}}
							>
								<ExternalLink className='h-4 w-4' />
								Open
							</ContextMenuItem>
						) : null}
						<ContextMenuItem
							disabled={isUpdatingTopic}
							onClick={() => {
								onCreateSubtopic(node.id)
							}}
						>
							<Plus className='h-4 w-4' />
							New topic
						</ContextMenuItem>
						<ContextMenuSeparator />
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
							className='mt-0.5 space-y-px border-border/60 border-l'
							style={{
								marginLeft: `${TOPIC_TREE_GUIDE_OFFSET_REM}rem`,
								paddingLeft: `${TOPIC_TREE_INDENT_REM}rem`
							}}
						>
							{node.children.map(childNode => (
								<TopicTreeItem
									activeDragTopicId={activeDragTopicId}
									activeTopicId={activeTopicId}
									ancestorIdsById={ancestorIdsById}
									expandedIdSet={expandedIdSet}
									highlightAppearance={highlightAppearance}
									highlightedDropTopicId={highlightedDropTopicId}
									highlightedTopicIds={highlightedTopicIds}
									hoveredTopicId={hoveredTopicId}
									isDragAndDropEnabled={isDragAndDropEnabled}
									isUpdatingTopic={isUpdatingTopic}
									key={childNode.id}
									node={childNode}
									nodeById={nodeById}
									onCreateSubtopic={onCreateSubtopic}
									onHoverTopicChange={onHoverTopicChange}
									onOpenTopic={onOpenTopic}
									onRequestDeleteTopic={onRequestDeleteTopic}
									onToggleExpanded={onToggleExpanded}
									renderPrimaryAction={renderPrimaryAction}
									setItemRef={setItemRef}
									suppressSelectionRef={suppressSelectionRef}
								/>
							))}
						</ul>
					) : null}
				</div>
			</li>
		</ContextMenu>
	)
}

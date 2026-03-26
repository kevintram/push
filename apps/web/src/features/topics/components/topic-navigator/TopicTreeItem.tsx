import { useDraggable, useDroppable } from '@dnd-kit/core'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import type { MutableRefObject, ReactNode } from 'react'
import { Button } from '~/components/ui/button'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger
} from '~/components/ui/context-menu'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'
import { getTopicDisplayTitle } from '~/features/topics/utils/topicTree'
import { cn } from '~/lib/utils'
import {
	TOPIC_NAVIGATOR_TREE_GUIDE_OFFSET_REM,
	TOPIC_NAVIGATOR_TREE_INDENT_REM
} from './TopicNavigator.shared'
import { canReparentTopic, createTopicDropId } from './topicNavigatorUtils'

type TopicTreeVariant = 'navigator' | 'outline'

type TopicTreeItemRenderProps = {
	className: string
	isActive: boolean
	isSubtreeHighlighted: boolean
	label: string
	node: TopicTreeNode
	suppressSelectionRef: MutableRefObject<boolean>
}

export type TopicTreeItemProps = {
	activeDragTopicId: number | null
	activeTopicId?: number | null
	ancestorIdsById: Map<number, Array<number>>
	depth?: number
	expandedIdSet: Set<number>
	highlightedDropTopicId: number | null
	isDragAndDropEnabled: boolean
	isUpdatingTopic: boolean
	node: TopicTreeNode
	nodeById: Map<number, TopicTreeNode>
	onCreateSubtopic: (topicId: number) => void
	onRequestDeleteTopic: (topicId: number) => void
	onToggleExpanded: (topicId: number) => void
	renderPrimaryAction: (props: TopicTreeItemRenderProps) => ReactNode
	setItemRef?: (topicId: number, element: HTMLLIElement | null) => void
	suppressSelectionRef: MutableRefObject<boolean>
	variant: TopicTreeVariant
}

export function TopicTreeItem({
	activeDragTopicId,
	activeTopicId,
	ancestorIdsById,
	depth = 0,
	expandedIdSet,
	highlightedDropTopicId,
	isDragAndDropEnabled,
	isUpdatingTopic,
	node,
	nodeById,
	onCreateSubtopic,
	onRequestDeleteTopic,
	onToggleExpanded,
	renderPrimaryAction,
	setItemRef,
	suppressSelectionRef,
	variant
}: TopicTreeItemProps) {
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

	const triggerProps =
		isDragAndDropEnabled && !isUpdatingTopic
			? { ...attributes, ...listeners }
			: {}

	const row = (
		<div
			className={cn(
				variant === 'navigator'
					? 'group/topic-row flex min-h-7 select-none items-center gap-0 rounded-md pr-0.5 transition-colors'
					: 'flex items-center gap-1 rounded-md px-2 py-1 transition-colors',
				isDragAndDropEnabled && !isUpdatingTopic && 'cursor-grab',
				isDragging && 'cursor-grabbing opacity-15',
				variant === 'navigator' && !isSubtreeHighlighted && 'hover:bg-muted/50',
				variant === 'outline' && isActive && 'bg-accent/70 text-foreground',
				variant === 'outline' &&
					!(isActive || isDropSubtreeHighlighted) &&
					'hover:bg-muted/50',
				variant === 'outline' &&
					isDropSubtreeHighlighted &&
					'bg-accent text-foreground ring-1 ring-border'
			)}
			style={
				variant === 'outline'
					? { paddingLeft: `${depth * 0.875 + 0.5}rem` }
					: undefined
			}
		>
			{hasChildren ? (
				<Button
					aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${label}`}
					className={cn(
						variant === 'navigator' ? 'h-5 w-5 shrink-0' : 'h-5 w-5 shrink-0'
					)}
					onClick={event => {
						event.stopPropagation()
						onToggleExpanded(node.id)
					}}
					size={variant === 'navigator' ? 'icon-xs' : 'icon-xs'}
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
			) : variant === 'outline' ? (
				<span aria-hidden='true' className='h-3.5 w-3.5 shrink-0' />
			) : null}
			{renderPrimaryAction({
				className:
					variant === 'navigator'
						? cn(
								'min-w-0 flex-1 truncate rounded-md py-1 text-sm underline-offset-4 transition-colors hover:underline',
								hasChildren ? 'pr-1.5 pl-0.5' : 'ml-1 px-1.5',
								isActive && 'font-medium text-foreground',
								!isActive && isSubtreeHighlighted && 'text-foreground',
								!(isActive || isSubtreeHighlighted) &&
									'text-muted-foreground hover:text-foreground'
							)
						: cn(
								'min-w-0 flex-1 truncate text-left text-sm',
								isActive
									? 'font-medium text-foreground'
									: 'text-muted-foreground'
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
						variant === 'navigator' && 'rounded-lg transition-colors',
						variant === 'navigator' &&
							isActiveSubtreeHighlighted &&
							'bg-accent/45 text-foreground ring-1 ring-border/60',
						variant === 'navigator' &&
							isDropSubtreeHighlighted &&
							'bg-accent text-foreground ring-1 ring-border'
					)}
				>
					<ContextMenuTrigger
						{...triggerProps}
						className={cn(
							'rounded-md',
							variant === 'outline' && isDragging && 'opacity-20'
						)}
						ref={element => {
							setDraggableNodeRef(element)
							setDroppableNodeRef(element)
						}}
					>
						{row}
					</ContextMenuTrigger>
					<ContextMenuContent
						align='start'
						side={variant === 'navigator' ? 'right' : 'left'}
						sideOffset={variant === 'navigator' ? 6 : 8}
					>
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
							className={cn(
								variant === 'navigator'
									? 'mt-0.5 space-y-px border-border/60 border-l'
									: 'space-y-0.5 py-0.5'
							)}
							style={
								variant === 'navigator'
									? {
											marginLeft: `${TOPIC_NAVIGATOR_TREE_GUIDE_OFFSET_REM}rem`,
											paddingLeft: `${TOPIC_NAVIGATOR_TREE_INDENT_REM}rem`
										}
									: undefined
							}
						>
							{node.children.map(childNode => (
								<TopicTreeItem
									activeDragTopicId={activeDragTopicId}
									activeTopicId={activeTopicId}
									ancestorIdsById={ancestorIdsById}
									depth={depth + 1}
									expandedIdSet={expandedIdSet}
									highlightedDropTopicId={highlightedDropTopicId}
									isDragAndDropEnabled={isDragAndDropEnabled}
									isUpdatingTopic={isUpdatingTopic}
									key={childNode.id}
									node={childNode}
									nodeById={nodeById}
									onCreateSubtopic={onCreateSubtopic}
									onRequestDeleteTopic={onRequestDeleteTopic}
									onToggleExpanded={onToggleExpanded}
									renderPrimaryAction={renderPrimaryAction}
									setItemRef={setItemRef}
									suppressSelectionRef={suppressSelectionRef}
									variant={variant}
								/>
							))}
						</ul>
					) : null}
				</div>
			</li>
		</ContextMenu>
	)
}

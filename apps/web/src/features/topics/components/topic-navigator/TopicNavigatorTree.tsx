import { useDroppable } from '@dnd-kit/core'
import { Link } from '@tanstack/react-router'
import type { MutableRefObject } from 'react'

import { TopicTreeItem } from '~/features/topics/components/topic-tree/TopicTreeItem'
import { TOPIC_DETAIL_INTENT_PRELOAD_DELAY } from '~/features/topics/hooks/usePrefetchTopicDetail'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'
import { cn } from '~/lib/utils'
import { canReparentTopic } from './topicNavigatorUtils'

export type TopicNavigatorItemProps = {
	node: TopicTreeNode
	activeTopicId?: number | null
	activeDragTopicId: number | null
	ancestorIdsById: Map<number, Array<number>>
	expandedIdSet: Set<number>
	highlightedDropTopicId: number | null
	hoveredTopicId: number | null
	isDragAndDropEnabled: boolean
	isUpdatingTopic: boolean
	nodeById: Map<number, TopicTreeNode>
	onNavigate?: () => void
	onHoverTopicChange: (topicId: number | null) => void
	onOpenTopic: (topicId: number) => void
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
				'rounded-md border border-dashed px-2.5 py-1.5 text-muted-foreground text-xs transition-colors',
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
		hoveredTopicId,
		isDragAndDropEnabled,
		isUpdatingTopic,
		nodeById,
		onNavigate,
		onCreateSubtopic,
		onHoverTopicChange,
		onOpenTopic,
		onRequestDeleteTopic,
		onToggleExpanded,
		suppressNavigationRef,
		setItemRef
	} = props

	return (
		<TopicTreeItem
			activeDragTopicId={activeDragTopicId}
			activeTopicId={activeTopicId}
			ancestorIdsById={ancestorIdsById}
			expandedIdSet={expandedIdSet}
			highlightedDropTopicId={highlightedDropTopicId}
			hoveredTopicId={hoveredTopicId}
			isDragAndDropEnabled={isDragAndDropEnabled}
			isUpdatingTopic={isUpdatingTopic}
			node={node}
			nodeById={nodeById}
			onCreateSubtopic={onCreateSubtopic}
			onHoverTopicChange={onHoverTopicChange}
			onOpenTopic={onOpenTopic}
			onRequestDeleteTopic={onRequestDeleteTopic}
			onToggleExpanded={onToggleExpanded}
			renderPrimaryAction={({
				className,
				isActive,
				isSubtreeHighlighted,
				label,
				node,
				suppressSelectionRef
			}) => (
				<Link
					aria-current={isActive ? 'page' : undefined}
					className={cn(
						className,
						isActive && 'font-medium text-foreground',
						!isActive && isSubtreeHighlighted && 'text-foreground',
						!(isActive || isSubtreeHighlighted) &&
							'text-muted-foreground hover:text-foreground'
					)}
					onClick={event => {
						if (suppressSelectionRef.current) {
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
			)}
			setItemRef={setItemRef}
			suppressSelectionRef={suppressNavigationRef}
		/>
	)
}

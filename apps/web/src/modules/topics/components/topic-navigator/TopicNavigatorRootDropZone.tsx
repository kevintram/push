import { useDroppable } from '@dnd-kit/core'

import { cn } from '~/lib/utils'
import { type TopicTreeNode } from '~/modules/topics/utils/topicTree'

import { canReparentTopic } from './topicNavigatorUtils'

type TopicNavigatorRootDropZoneProps = {
	activeDragTopicId: number | null
	ancestorIdsById: Map<number, Array<number>>
	className?: string
	id: string
	nodeById: Map<number, TopicTreeNode>
}

export function TopicNavigatorRootDropZone({
	activeDragTopicId,
	ancestorIdsById,
	className,
	id,
	nodeById,
}: TopicNavigatorRootDropZoneProps) {
	const canDropToRoot =
		activeDragTopicId != null &&
		canReparentTopic({
			draggedTopicId: activeDragTopicId,
			nextParentId: null,
			ancestorIdsById,
			nodeById,
		})

	const { isOver, setNodeRef } = useDroppable({
		id,
		disabled: !canDropToRoot,
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
					'border-foreground/30 bg-accent text-foreground',
			)}
			ref={setNodeRef}
		>
			Move to top level
		</div>
	)
}

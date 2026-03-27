import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'

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
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useTopicTreeActions } from '~/features/topics/hooks/useTopicTreeActions'
import { getTopicDisplayTitle } from '~/features/topics/utils/topicTree'
import {
	TopicNavigatorItem,
	TopicNavigatorRootDropZone
} from './TopicNavigatorTree'
import { createRootDropId } from './topicNavigatorUtils'
import { useTopicNavigatorContent } from './useTopicNavigatorContent'

type TopicNavigatorContentProps = {
	activeTopicId?: number | null
	autoScrollActiveTopic?: boolean
	enableDragAndDrop?: boolean
	onNavigate?: () => void
}

export function TopicNavigatorContent({
	activeTopicId,
	autoScrollActiveTopic = false,
	enableDragAndDrop = false,
	onNavigate
}: TopicNavigatorContentProps) {
	const navigate = useNavigate()
	const {
		activeDragLabel,
		activeDragTopicId,
		ancestorIdsById,
		ensureExpanded,
		error,
		expandedIdSet,
		handleDragCancel,
		handleDragEnd,
		handleDragOver,
		handleDragStart,
		highlightedDropTopicId,
		hoveredTopicId,
		isLoading,
		isUpdatingTopic,
		nodeById,
		roots,
		scrollViewportRef,
		sensors,
		setHoveredTopicId,
		setItemRef,
		suppressNavigationRef,
		toggleExpanded
	} = useTopicNavigatorContent({
		activeTopicId,
		autoScrollActiveTopic
	})
	const {
		handleConfirmDeleteTopic,
		handleCreateSubtopic,
		handleDialogOpenChange,
		isDeletingTopic,
		pendingDeleteTopic,
		pendingDeleteTopicId,
		setPendingDeleteTopicId
	} = useTopicTreeActions({
		activeTopicId,
		ancestorIdsById,
		nodeById,
		onAfterCreateSubtopic: parentTopicId => {
			ensureExpanded(parentTopicId)
		},
		onAfterRouteChange: onNavigate
	})
	const isTreeMutating = isUpdatingTopic || isDeletingTopic
	const handleOpenTopic = (topicId: number) => {
		navigate({
			to: '/topics/$topicId',
			params: { topicId: topicId.toString() }
		})
			.then(() => {
				onNavigate?.()
			})
			.catch(() => {})
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
			<nav aria-label='Topic hierarchy' className='space-y-1.5'>
				{enableDragAndDrop ? (
					<TopicNavigatorRootDropZone
						activeDragTopicId={activeDragTopicId}
						ancestorIdsById={ancestorIdsById}
						className='mb-0.5'
						id={createRootDropId('top')}
						nodeById={nodeById}
					/>
				) : null}
				<ul className='space-y-px' ref={scrollViewportRef}>
					{roots.map(rootNode => (
						<TopicNavigatorItem
							activeDragTopicId={activeDragTopicId}
							activeTopicId={activeTopicId}
							ancestorIdsById={ancestorIdsById}
							expandedIdSet={expandedIdSet}
							highlightedDropTopicId={highlightedDropTopicId}
							hoveredTopicId={hoveredTopicId}
							isDragAndDropEnabled={enableDragAndDrop}
							isUpdatingTopic={isTreeMutating}
							key={rootNode.id}
							node={rootNode}
							nodeById={nodeById}
							onCreateSubtopic={handleCreateSubtopic}
							onHoverTopicChange={setHoveredTopicId}
							onNavigate={onNavigate}
							onOpenTopic={handleOpenTopic}
							onRequestDeleteTopic={setPendingDeleteTopicId}
							onToggleExpanded={toggleExpanded}
							setItemRef={setItemRef}
							suppressNavigationRef={suppressNavigationRef}
						/>
					))}
				</ul>
				{enableDragAndDrop ? (
					<TopicNavigatorRootDropZone
						activeDragTopicId={activeDragTopicId}
						ancestorIdsById={ancestorIdsById}
						className='mt-0.5'
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
				onOpenChange={handleDialogOpenChange}
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
								? `Delete ${getTopicDisplayTitle(pendingDeleteTopic.title, pendingDeleteTopic.body)} and all of its subtopics, review cards, and reviews? This action cannot be undone.`
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
							onClick={handleConfirmDeleteTopic}
						>
							{isDeletingTopic ? 'Deleting...' : 'Delete topic'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</DndContext>
	)
}

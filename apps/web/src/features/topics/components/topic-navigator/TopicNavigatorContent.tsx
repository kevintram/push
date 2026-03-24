import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { Link, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, House, Plus } from 'lucide-react'
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
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'
import { SidebarContent, SidebarHeader } from '~/components/ui/sidebar'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { requestFocusNewTopicTitle } from '~/features/topics/createTopicIntent'
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
	const {
		activeDragLabel,
		activeDragTopicId,
		ancestorIdsById,
		error,
		expandedIdSet,
		handleConfirmDeleteTopic,
		handleCreateSubtopic,
		handleDialogOpenChange,
		handleDragCancel,
		handleDragEnd,
		handleDragOver,
		handleDragStart,
		highlightedDropTopicId,
		isDeletingTopic,
		isLoading,
		isUpdatingTopic,
		nodeById,
		pendingDeleteTopic,
		pendingDeleteTopicId,
		roots,
		scrollViewportRef,
		sensors,
		setItemRef,
		setPendingDeleteTopicId,
		suppressNavigationRef,
		toggleExpanded
	} = useTopicNavigatorContent({
		activeTopicId,
		autoScrollActiveTopic,
		enableDragAndDrop,
		onNavigate
	})

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
				<ul className='space-y-1' ref={scrollViewportRef}>
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
							onCreateSubtopic={handleCreateSubtopic}
							onNavigate={onNavigate}
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

export function TopicNavigatorPanel({
	activeTopicId,
	autoScrollActiveTopic = false,
	enableDragAndDrop = false,
	onNavigate
}: TopicNavigatorContentProps) {
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
		<div className='flex min-h-0 flex-1 flex-col'>
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
			<SidebarContent className='overflow-hidden p-0'>
				<ScrollArea
					className='min-h-0 flex-1'
					scrollbarClassName='p-px data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5'
				>
					<div className='p-2'>
						<TopicNavigatorContent
							activeTopicId={activeTopicId}
							autoScrollActiveTopic={autoScrollActiveTopic}
							enableDragAndDrop={enableDragAndDrop}
							onNavigate={onNavigate}
						/>
					</div>
				</ScrollArea>
			</SidebarContent>
		</div>
	)
}

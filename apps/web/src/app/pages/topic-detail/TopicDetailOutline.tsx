import { useNavigate } from '@tanstack/react-router'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import type { MouseEvent } from 'react'
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
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger
} from '~/components/ui/context-menu'
import { Separator } from '~/components/ui/separator'
import { TopicTreeItem } from '~/features/topics/components/topic-tree/TopicTreeItem'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'
import { getTopicDisplayTitle } from '~/features/topics/utils/topicTree'
import { cn } from '~/lib/utils'
import type { TopicDetailReviewCardFilter } from './shared'
import { TopicDetailReviewCardFilterControls } from './TopicDetailReviewCardControls'
import { getTopicDetailHash } from './topicDetailStructure'
import { useTopicDetailOutline } from './useTopicDetailOutline'

interface TopicDetailOutlineProps {
	ancestorIdsById: Map<number, Array<number>>
	globalFilter: TopicDetailReviewCardFilter
	nodeById: Map<number, TopicTreeNode>
	onGlobalFilterChange: (filter: TopicDetailReviewCardFilter) => void
	outlineRootNode: TopicTreeNode | null
	visibleSectionIds: Array<number>
}

export function TopicDetailOutline({
	ancestorIdsById,
	globalFilter,
	nodeById,
	onGlobalFilterChange,
	outlineRootNode,
	visibleSectionIds
}: TopicDetailOutlineProps) {
	const navigate = useNavigate()
	const {
		expandedIdSet,
		handleConfirmDeleteTopic,
		handleCreateSubtopic,
		handleDialogOpenChange,
		isDeletingTopic,
		isUpdatingTopic,
		pendingDeleteTopic,
		pendingDeleteTopicId,
		setPendingDeleteTopicId,
		suppressSelectionRef,
		toggleExpanded
	} = useTopicDetailOutline({
		ancestorIdsById,
		nodeById,
		outlineRootNode,
		visibleSectionIds
	})

	if (!outlineRootNode || outlineRootNode.children.length === 0) return null

	const rootLabel = getTopicDisplayTitle(
		outlineRootNode.title,
		outlineRootNode.body
	)
	const outlineNodes = outlineRootNode.children
	const visibleOutlineTopicIds = new Set(visibleSectionIds)
	const isRootActive =
		visibleSectionIds.length === 0 ||
		visibleOutlineTopicIds.has(outlineRootNode.id)
	const handleOpenTopic = (topicId: number) => {
		navigate({
			to: '/topics/$topicId',
			params: { topicId: topicId.toString() }
		}).catch(() => {})
	}
	const handleOutlineClick = (
		event: MouseEvent<HTMLAnchorElement>,
		suppressSelectionRef: { current: boolean }
	) => {
		if (!suppressSelectionRef.current) return

		event.preventDefault()
		event.stopPropagation()
	}

	return (
		<aside className='sticky top-6 hidden w-52 shrink-0 self-start lg:block'>
			<nav aria-label='On this page' className='space-y-1.5'>
				<ul className='space-y-px'>
					<ContextMenu>
						<li>
							<ContextMenuTrigger className='rounded-md'>
								<div className='group/topic-row flex min-h-7 items-center rounded-md pr-0.5 transition-colors hover:bg-muted/50'>
									<a
										className={cn(
											'min-w-0 flex-1 truncate rounded-md px-1.5 py-1 text-left text-sm underline-offset-4 transition-colors hover:underline',
											isRootActive
												? 'font-bold text-foreground'
												: 'font-semibold text-muted-foreground hover:text-foreground'
										)}
										href={getTopicDetailHash(outlineRootNode.id)}
										onClick={event => {
											handleOutlineClick(event, suppressSelectionRef)
										}}
									>
										{rootLabel}
									</a>
								</div>
							</ContextMenuTrigger>
							<ContextMenuContent align='start' side='right' sideOffset={6}>
								<ContextMenuItem
									disabled={isUpdatingTopic}
									onClick={() => {
										handleOpenTopic(outlineRootNode.id)
									}}
								>
									<ExternalLink className='h-4 w-4' />
									Open
								</ContextMenuItem>
								<ContextMenuItem
									disabled={isUpdatingTopic}
									onClick={() => {
										handleCreateSubtopic(outlineRootNode.id)
									}}
								>
									<Plus className='h-4 w-4' />
									New topic
								</ContextMenuItem>
								<ContextMenuSeparator />
								<ContextMenuItem
									disabled={isUpdatingTopic}
									onClick={() => {
										setPendingDeleteTopicId(outlineRootNode.id)
									}}
									variant='destructive'
								>
									<Trash2 className='h-4 w-4' />
									Delete
								</ContextMenuItem>
							</ContextMenuContent>
						</li>
					</ContextMenu>
					{outlineNodes.map(node => (
						<TopicTreeItem
							activeDragTopicId={null}
							ancestorIdsById={ancestorIdsById}
							expandedIdSet={expandedIdSet}
							highlightAppearance='text-only'
							highlightedDropTopicId={null}
							highlightedTopicIds={visibleOutlineTopicIds}
							isDragAndDropEnabled={false}
							isUpdatingTopic={isUpdatingTopic}
							key={node.id}
							node={node}
							nodeById={nodeById}
							onCreateSubtopic={handleCreateSubtopic}
							onOpenTopic={handleOpenTopic}
							onRequestDeleteTopic={setPendingDeleteTopicId}
							onToggleExpanded={toggleExpanded}
							renderPrimaryAction={({
								className,
								label,
								node,
								suppressSelectionRef
							}) => (
								<a
									className={cn(className, 'w-full text-left')}
									href={getTopicDetailHash(node.id)}
									onClick={event => {
										handleOutlineClick(event, suppressSelectionRef)
									}}
								>
									{label}
								</a>
							)}
							suppressSelectionRef={suppressSelectionRef}
						/>
					))}
				</ul>
			</nav>
			<Separator className='my-3' />
			<div>
				<TopicDetailReviewCardFilterControls
					activeFilter={globalFilter}
					controlsVariant='compact'
					onFilterChange={onGlobalFilterChange}
				/>
			</div>
			<AlertDialog
				onOpenChange={handleDialogOpenChange}
				open={pendingDeleteTopicId !== null}
			>
				<AlertDialogContent size='sm'>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<Trash2 className='h-5 w-5' />
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
		</aside>
	)
}

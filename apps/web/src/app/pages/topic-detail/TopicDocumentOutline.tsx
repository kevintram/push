import { Trash2 } from 'lucide-react'
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
import { Separator } from '~/components/ui/separator'
import { TopicTreeItem } from '~/features/topics/components/topic-navigator/TopicTreeItem'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'
import { cn } from '~/lib/utils'
import type { TopicDetailReviewCardFilter } from './shared'
import { TopicDocumentReviewCardFilter } from './TopicDocumentReviewCardFilter'
import { getTopicDocumentLabel } from './topicDocumentUtils'
import { useTopicDocumentOutline } from './useTopicDocumentOutline'

type TopicDocumentOutlineProps = {
	activeSectionId: number
	ancestorIdsById: Map<number, Array<number>>
	globalFilter: TopicDetailReviewCardFilter
	nodeById: Map<number, TopicTreeNode>
	onGlobalFilterChange: (filter: TopicDetailReviewCardFilter) => void
	outlineRootNode: TopicTreeNode | null
	onSelectTopic: (topicId: number) => void
}

export function TopicDocumentOutline({
	activeSectionId,
	ancestorIdsById,
	globalFilter,
	nodeById,
	onGlobalFilterChange,
	outlineRootNode,
	onSelectTopic
}: TopicDocumentOutlineProps) {
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
	} = useTopicDocumentOutline({
		activeSectionId,
		ancestorIdsById,
		nodeById,
		outlineRootNode
	})

	if (!outlineRootNode) return null

	const outlineNodes = outlineRootNode.children
	const activeOutlineTopicId =
		activeSectionId === outlineRootNode.id ? null : activeSectionId

	return (
		<aside className='sticky top-6 hidden w-52 shrink-0 self-start xl:block'>
			<div className='mb-1.5'>
				<h2 className='font-medium text-[0.6875rem] text-muted-foreground/70 uppercase tracking-widest'>
					On this page
				</h2>
			</div>
			<nav aria-label='On this page' className='space-y-1.5'>
				{outlineNodes.length > 0 ? (
					<ul className='space-y-px'>
						{outlineNodes.map(node => (
							<TopicTreeItem
								activeDragTopicId={null}
								activeTopicId={activeOutlineTopicId}
								ancestorIdsById={ancestorIdsById}
								expandedIdSet={expandedIdSet}
								highlightedDropTopicId={null}
								isDragAndDropEnabled={false}
								isUpdatingTopic={isUpdatingTopic}
								key={node.id}
								node={node}
								nodeById={nodeById}
								onCreateSubtopic={handleCreateSubtopic}
								onRequestDeleteTopic={setPendingDeleteTopicId}
								onToggleExpanded={toggleExpanded}
								renderPrimaryAction={({
									className,
									label,
									node,
									suppressSelectionRef
								}) => (
									<button
										className={cn(className, 'w-full text-left')}
										onClick={event => {
											if (suppressSelectionRef.current) {
												event.preventDefault()
												event.stopPropagation()
												return
											}

											onSelectTopic(node.id)
										}}
										type='button'
									>
										{label}
									</button>
								)}
								suppressSelectionRef={suppressSelectionRef}
								variant='navigator'
							/>
						))}
					</ul>
				) : null}
			</nav>
			<Separator className='my-3' />
			<div>
				<TopicDocumentReviewCardFilter
					activeFilter={globalFilter}
					onFilterChange={onGlobalFilterChange}
				/>
			</div>
			<AlertDialog
				onOpenChange={handleDialogOpenChange}
				open={pendingDeleteTopicId != null}
			>
				<AlertDialogContent size='sm'>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<Trash2 className='h-5 w-5' />
						</AlertDialogMedia>
						<AlertDialogTitle>Delete topic?</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingDeleteTopic
								? `Delete ${getTopicDocumentLabel(pendingDeleteTopic.title, pendingDeleteTopic.body)} and all of its subtopics, review cards, and reviews? This action cannot be undone.`
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

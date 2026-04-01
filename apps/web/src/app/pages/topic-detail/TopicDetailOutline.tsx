import { Link, useNavigate } from '@tanstack/react-router'
import { ExternalLink, Loader, Plus, Trash2 } from 'lucide-react'
import { type MouseEvent, useCallback, useMemo, useRef, useState } from 'react'
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
import { TopicDetailOutlineHeader } from './TopicDetailOutlineHeader'
import { TopicDetailReviewCardFilterControls } from './TopicDetailReviewCardControls'
import {
	TOPIC_DETAIL_OUTLINE_MAX_WIDTH,
	TOPIC_DETAIL_OUTLINE_MIN_WIDTH
} from './topicDetailLayout'
import { getTopicDetailSectionId } from './topicDetailStructure'
import { useTopicDetailOutline } from './useTopicDetailOutline'
import { useTopicDetailOutlineSizing } from './useTopicDetailOutlineSizing'

interface TopicDetailOutlineProps {
	ancestorIdsById: Map<number, Array<number>>
	freshTopicId: number | null
	globalFilter: TopicDetailReviewCardFilter
	nodeById: Map<number, TopicTreeNode>
	onGlobalFilterChange: (filter: TopicDetailReviewCardFilter) => void
	onOutlineWidthChange: (width: number) => void
	onSubtopicCreated: (parentTopicId: number, createdTopicId: number) => void
	onSectionSelect: (topicId: number) => void
	outlineRootNode: TopicTreeNode | null
	outlineWidth: number
	pendingCreatedParentTopicId: number | null
	pendingCreatedTopicId: number | null
	visibleSectionIds: Array<number>
}

function shouldHandleSamePageSectionNavigation(
	event: MouseEvent<HTMLAnchorElement>
) {
	return !(
		event.button !== 0 ||
		event.altKey ||
		event.ctrlKey ||
		event.metaKey ||
		event.shiftKey
	)
}

export function TopicDetailOutline({
	ancestorIdsById,
	freshTopicId,
	globalFilter,
	nodeById,
	onGlobalFilterChange,
	onOutlineWidthChange,
	onSubtopicCreated,
	onSectionSelect,
	outlineRootNode,
	outlineWidth,
	pendingCreatedParentTopicId,
	pendingCreatedTopicId,
	visibleSectionIds
}: TopicDetailOutlineProps) {
	const [isRootContextMenuOpen, setIsRootContextMenuOpen] = useState(false)
	const [isCreatingRootContextTopic, setIsCreatingRootContextTopic] =
		useState(false)
	const navigate = useNavigate()
	const {
		collapseAll,
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
		onCreateSubtopicCreated: onSubtopicCreated,
		outlineRootNode,
		pendingCreatedParentTopicId,
		visibleSectionIds
	})
	const rootLabel = outlineRootNode
		? getTopicDisplayTitle(outlineRootNode.title, outlineRootNode.body)
		: ''
	const outlineNodes = outlineRootNode?.children ?? []
	const {
		asideStyle,
		footerRef,
		handleResizeKeyDown,
		handleResizeStart,
		outlineHeaderRef,
		outlineListStyle,
		outlineNavRef,
		outlineRef,
		registerOutlineItemRef,
		resizeButtonRef
	} = useTopicDetailOutlineSizing({
		onOutlineWidthChange,
		outlineNodeCount: outlineNodes.length,
		outlineWidth,
		pendingCreatedTopicId,
		rootLabel
	})

	const outlineScrollRef = useRef<HTMLDivElement>(null)
	const handleScrollToTop = useCallback(() => {
		outlineScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
	}, [])

	const visibleOutlineTopicIds = useMemo(
		() => new Set(visibleSectionIds),
		[visibleSectionIds]
	)
	const freshOutlineTopicIds = useMemo(
		() => (freshTopicId == null ? undefined : new Set([freshTopicId])),
		[freshTopicId]
	)
	const handleOpenTopic = useCallback(
		(topicId: number) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: topicId.toString() }
			}).catch(() => {})
		},
		[navigate]
	)
	const handleOutlineClick = useCallback(
		(
			event: MouseEvent<HTMLAnchorElement>,
			topicId: number,
			suppressSelectionRef: { current: boolean }
		) => {
			if (suppressSelectionRef.current) {
				event.preventDefault()
				event.stopPropagation()
				return
			}

			if (!shouldHandleSamePageSectionNavigation(event)) return

			event.preventDefault()
			onSectionSelect(topicId)
		},
		[onSectionSelect]
	)

	if (!outlineRootNode) return null

	const isRootActive =
		visibleSectionIds.length === 0 ||
		visibleOutlineTopicIds.has(outlineRootNode.id)
	const outlineRootTopicId = outlineRootNode.id.toString()
	const renderOutlinePrimaryAction = useCallback(
		({
			className,
			label,
			node,
			suppressSelectionRef
		}: {
			className: string
			label: string
			node: TopicTreeNode
			suppressSelectionRef: { current: boolean }
		}) => (
			<Link
				className={cn(className, 'w-full text-left')}
				hash={getTopicDetailSectionId(node.id)}
				hashScrollIntoView={false}
				onClick={event => {
					handleOutlineClick(event, node.id, suppressSelectionRef)
				}}
				params={{ topicId: outlineRootTopicId }}
				resetScroll={false}
				search={true}
				to='/topics/$topicId'
			>
				{label}
			</Link>
		),
		[handleOutlineClick, outlineRootTopicId]
	)
	const handleAddChildTopic = useCallback(() => {
		return handleCreateSubtopic(outlineRootNode.id)
	}, [handleCreateSubtopic, outlineRootNode.id])

	return (
		<aside
			className='relative flex min-h-0 min-w-0 shrink-0 flex-col self-start'
			ref={outlineRef}
			style={asideStyle}
		>
			<button
				aria-label='Resize outline'
				aria-orientation='vertical'
				aria-valuemax={TOPIC_DETAIL_OUTLINE_MAX_WIDTH}
				aria-valuemin={TOPIC_DETAIL_OUTLINE_MIN_WIDTH}
				aria-valuenow={outlineWidth}
				className='absolute top-0 right-0 bottom-0 z-20 hidden w-3 translate-x-1/2 cursor-col-resize lg:flex'
				onKeyDown={handleResizeKeyDown}
				onPointerDown={handleResizeStart}
				ref={resizeButtonRef}
				type='button'
			/>
			<div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
				<div className='min-h-0 min-w-0 shrink-0 pr-1' style={outlineListStyle}>
					<div className='h-full min-h-0 overflow-y-auto pr-2'>
						<div className='flex h-full min-h-0 flex-col'>
							<div className='shrink-0' ref={outlineHeaderRef}>
								<TopicDetailOutlineHeader
									isUpdatingTopic={isUpdatingTopic}
									onAdd={handleAddChildTopic}
									onCollapseAll={collapseAll}
									onScrollToTop={handleScrollToTop}
								/>
							</div>
							<div
								className='min-h-0 flex-1 overflow-y-auto'
								ref={outlineScrollRef}
							>
								<nav
									aria-label='On this page'
									className='min-w-0'
									ref={outlineNavRef}
								>
									<ul className='space-y-px'>
										<ContextMenu
											onOpenChange={nextOpen => {
												if (isCreatingRootContextTopic) return
												setIsRootContextMenuOpen(nextOpen)
											}}
											open={isRootContextMenuOpen}
										>
											<li>
												<ContextMenuTrigger className='rounded-md'>
													<div
														className={cn(
															'group/topic-row flex min-h-7 items-center rounded-md pr-0.5 transition-colors hover:bg-[var(--app-chrome-hover)]'
														)}
														data-fresh-topic={
															freshTopicId === outlineRootNode.id
																? 'true'
																: undefined
														}
													>
														<Link
															className={cn(
																'min-w-0 flex-1 truncate rounded-md px-1.5 py-1 text-left text-sm underline-offset-4 transition-colors hover:underline',
																isRootActive
																	? 'font-bold text-foreground'
																	: 'font-semibold text-muted-foreground hover:text-foreground'
															)}
															hash={getTopicDetailSectionId(outlineRootNode.id)}
															hashScrollIntoView={false}
															onClick={event => {
																handleOutlineClick(
																	event,
																	outlineRootNode.id,
																	suppressSelectionRef
																)
															}}
															params={{ topicId: outlineRootTopicId }}
															resetScroll={false}
															search={true}
															to='/topics/$topicId'
														>
															{rootLabel}
														</Link>
													</div>
												</ContextMenuTrigger>
												<ContextMenuContent
													align='start'
													side='right'
													sideOffset={6}
												>
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
														closeOnClick={false}
														disabled={
															isUpdatingTopic || isCreatingRootContextTopic
														}
														onClick={() => {
															setIsCreatingRootContextTopic(true)
															handleCreateSubtopic(outlineRootNode.id).finally(
																() => {
																	setIsCreatingRootContextTopic(false)
																	setIsRootContextMenuOpen(false)
																}
															)
														}}
													>
														{isCreatingRootContextTopic ? (
															<>
																<Loader className='h-4 w-4 animate-spin' />
																Creating...
															</>
														) : (
															<>
																<Plus className='h-4 w-4' />
																New topic
															</>
														)}
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
												freshTopicIds={freshOutlineTopicIds}
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
												renderPrimaryAction={renderOutlinePrimaryAction}
												setItemRef={registerOutlineItemRef}
												suppressSelectionRef={suppressSelectionRef}
											/>
										))}
									</ul>
								</nav>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div
				className='flex min-w-0 shrink-0 flex-col gap-3 pt-3 pr-1 pb-6'
				ref={footerRef}
			>
				<Separator />
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

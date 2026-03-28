import { Link, useNavigate } from '@tanstack/react-router'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import {
	type CSSProperties,
	type KeyboardEvent,
	type MouseEvent,
	type PointerEvent as ReactPointerEvent,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react'
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
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'
import { TopicTreeItem } from '~/features/topics/components/topic-tree/TopicTreeItem'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'
import { getTopicDisplayTitle } from '~/features/topics/utils/topicTree'
import { useElementSize } from '~/hooks/useResizeObserver'
import { cn } from '~/lib/utils'
import type { TopicDetailReviewCardFilter } from './shared'
import { TopicDetailReviewCardFilterControls } from './TopicDetailReviewCardControls'
import {
	TOPIC_DETAIL_OUTLINE_MAX_WIDTH,
	TOPIC_DETAIL_OUTLINE_MIN_WIDTH
} from './topicDetailLayout'
import { getTopicDetailSectionId } from './topicDetailStructure'
import { useTopicDetailOutline } from './useTopicDetailOutline'

interface TopicDetailOutlineProps {
	ancestorIdsById: Map<number, Array<number>>
	globalFilter: TopicDetailReviewCardFilter
	nodeById: Map<number, TopicTreeNode>
	onGlobalFilterChange: (filter: TopicDetailReviewCardFilter) => void
	onOutlineWidthChange: (width: number) => void
	outlineRootNode: TopicTreeNode | null
	outlineWidth: number
	visibleSectionIds: Array<number>
}

export function TopicDetailOutline({
	ancestorIdsById,
	globalFilter,
	nodeById,
	onGlobalFilterChange,
	onOutlineWidthChange,
	outlineRootNode,
	outlineWidth,
	visibleSectionIds
}: TopicDetailOutlineProps) {
	const navigate = useNavigate()
	const { ref: outlineNavRef, height: outlineNavHeight } =
		useElementSize<HTMLElement>()
	const { ref: outlineFooterRef, height: outlineFooterHeight } =
		useElementSize<HTMLDivElement>()
	const [viewportHeight, setViewportHeight] = useState(0)
	const outlineRef = useRef<HTMLElement | null>(null)
	const resizeCleanupRef = useRef<(() => void) | null>(null)
	const resizeFrameRef = useRef<number | null>(null)
	const resizeButtonRef = useRef<HTMLButtonElement | null>(null)
	const outlineWidthRef = useRef(outlineWidth)
	const pendingWidthRef = useRef(outlineWidth)
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
	const outlineRootTopicId = outlineRootNode.id.toString()
	const stickyTopOffset = 24

	const clampOutlineWidth = (width: number) =>
		Math.min(
			Math.max(width, TOPIC_DETAIL_OUTLINE_MIN_WIDTH),
			TOPIC_DETAIL_OUTLINE_MAX_WIDTH
		)

	useEffect(() => {
		if (typeof window === 'undefined') return

		const updateViewportHeight = () => {
			setViewportHeight(window.innerHeight)
		}

		updateViewportHeight()
		window.addEventListener('resize', updateViewportHeight)

		return () => {
			window.removeEventListener('resize', updateViewportHeight)
		}
	}, [])

	useEffect(
		() => () => {
			resizeCleanupRef.current?.()
			if (resizeFrameRef.current !== null) {
				cancelAnimationFrame(resizeFrameRef.current)
			}
		},
		[]
	)

	useEffect(() => {
		outlineWidthRef.current = outlineWidth
		pendingWidthRef.current = outlineWidth

		if (outlineRef.current) {
			outlineRef.current.style.width = `${outlineWidth}px`
		}

		if (resizeButtonRef.current) {
			resizeButtonRef.current.setAttribute(
				'aria-valuenow',
				outlineWidth.toString()
			)
		}
	}, [outlineWidth])

	const outlineRailStyle = useMemo<CSSProperties | undefined>(() => {
		if (viewportHeight <= stickyTopOffset) return

		const maxOutlineHeight = viewportHeight - stickyTopOffset
		const preferredOutlineHeight = outlineNavHeight + outlineFooterHeight

		if (preferredOutlineHeight <= 0) {
			return {
				maxHeight: `${maxOutlineHeight}px`
			}
		}

		return {
			height: `${Math.min(preferredOutlineHeight, maxOutlineHeight)}px`,
			maxHeight: `${maxOutlineHeight}px`
		}
	}, [outlineFooterHeight, outlineNavHeight, viewportHeight])
	const asideStyle = useMemo<CSSProperties>(
		() => ({
			...outlineRailStyle,
			width: `${outlineWidth}px`
		}),
		[outlineRailStyle, outlineWidth]
	)

	const applyOutlineWidth = (nextWidth: number) => {
		outlineWidthRef.current = nextWidth
		pendingWidthRef.current = nextWidth

		if (resizeButtonRef.current) {
			resizeButtonRef.current.setAttribute(
				'aria-valuenow',
				nextWidth.toString()
			)
		}

		if (resizeFrameRef.current !== null) return

		resizeFrameRef.current = requestAnimationFrame(() => {
			resizeFrameRef.current = null

			if (outlineRef.current) {
				outlineRef.current.style.width = `${pendingWidthRef.current}px`
			}
		})
	}

	const handleResizeStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
		if (event.button !== 0) return

		const startX = event.clientX
		const startWidth = outlineWidthRef.current
		const originalCursor = document.body.style.cursor
		const originalUserSelect = document.body.style.userSelect

		const cleanup = () => {
			window.removeEventListener('pointermove', handlePointerMove)
			window.removeEventListener('pointerup', handlePointerUp)
			document.body.style.cursor = originalCursor
			document.body.style.userSelect = originalUserSelect
			resizeCleanupRef.current = null
		}

		const handlePointerMove = (moveEvent: PointerEvent) => {
			applyOutlineWidth(
				clampOutlineWidth(startWidth + (moveEvent.clientX - startX))
			)
		}

		const handlePointerUp = () => {
			const finalWidth = outlineWidthRef.current
			cleanup()
			onOutlineWidthChange(finalWidth)
		}

		resizeCleanupRef.current?.()
		resizeCleanupRef.current = cleanup
		document.body.style.cursor = 'col-resize'
		document.body.style.userSelect = 'none'
		window.addEventListener('pointermove', handlePointerMove)
		window.addEventListener('pointerup', handlePointerUp)
	}

	const handleResizeKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (event.key === 'ArrowLeft') {
			event.preventDefault()
			const nextWidth = clampOutlineWidth(outlineWidthRef.current - 16)
			applyOutlineWidth(nextWidth)
			onOutlineWidthChange(nextWidth)
			return
		}

		if (event.key === 'ArrowRight') {
			event.preventDefault()
			const nextWidth = clampOutlineWidth(outlineWidthRef.current + 16)
			applyOutlineWidth(nextWidth)
			onOutlineWidthChange(nextWidth)
			return
		}

		if (event.key === 'Home') {
			event.preventDefault()
			applyOutlineWidth(TOPIC_DETAIL_OUTLINE_MIN_WIDTH)
			onOutlineWidthChange(TOPIC_DETAIL_OUTLINE_MIN_WIDTH)
			return
		}

		if (event.key === 'End') {
			event.preventDefault()
			applyOutlineWidth(TOPIC_DETAIL_OUTLINE_MAX_WIDTH)
			onOutlineWidthChange(TOPIC_DETAIL_OUTLINE_MAX_WIDTH)
		}
	}

	return (
		<aside
			className='relative flex min-h-0 shrink-0 flex-col self-start pb-6'
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
			<ScrollArea
				className='min-h-0 flex-1 overflow-hidden'
				scrollbarClassName='p-px data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5'
			>
				<nav
					aria-label='On this page'
					className='space-y-1.5 pr-3'
					ref={outlineNavRef}
				>
					<ul className='space-y-px'>
						<ContextMenu>
							<li>
								<ContextMenuTrigger className='rounded-md'>
									<div className='group/topic-row flex min-h-7 items-center rounded-md pr-0.5 transition-colors hover:bg-muted/50'>
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
												handleOutlineClick(event, suppressSelectionRef)
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
									<Link
										className={cn(className, 'w-full text-left')}
										hash={getTopicDetailSectionId(node.id)}
										hashScrollIntoView={false}
										onClick={event => {
											handleOutlineClick(event, suppressSelectionRef)
										}}
										params={{ topicId: outlineRootTopicId }}
										resetScroll={false}
										search={true}
										to='/topics/$topicId'
									>
										{label}
									</Link>
								)}
								suppressSelectionRef={suppressSelectionRef}
							/>
						))}
					</ul>
				</nav>
			</ScrollArea>
			<div className='flex flex-col gap-3 pt-3' ref={outlineFooterRef}>
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

import { Link, useNavigate } from '@tanstack/react-router'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import {
	type CSSProperties,
	type KeyboardEvent,
	type MouseEvent,
	type PointerEvent as ReactPointerEvent,
	useCallback,
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
import { Separator } from '~/components/ui/separator'
import { TopicTreeItem } from '~/features/topics/components/topic-tree/TopicTreeItem'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'
import { getTopicDisplayTitle } from '~/features/topics/utils/topicTree'
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
	onSectionSelect: (topicId: number) => void
	outlineRootNode: TopicTreeNode | null
	outlineWidth: number
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
	globalFilter,
	nodeById,
	onGlobalFilterChange,
	onOutlineWidthChange,
	onSectionSelect,
	outlineRootNode,
	outlineWidth,
	visibleSectionIds
}: TopicDetailOutlineProps) {
	const navigate = useNavigate()
	const [footerHeight, setFooterHeight] = useState(0)
	const [outlineContentHeight, setOutlineContentHeight] = useState(0)
	const [outlineTopOffset, setOutlineTopOffset] = useState(0)
	const [viewportHeight, setViewportHeight] = useState(0)
	const footerRef = useRef<HTMLDivElement | null>(null)
	const outlineNavRef = useRef<HTMLElement | null>(null)
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
	const visibleOutlineTopicIds = useMemo(
		() => new Set(visibleSectionIds),
		[visibleSectionIds]
	)
	const isRootActive =
		visibleSectionIds.length === 0 ||
		visibleOutlineTopicIds.has(outlineRootNode.id)
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
	const outlineRootTopicId = outlineRootNode.id.toString()
	const stickyTopOffset = 24
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

	const clampOutlineWidth = (width: number) =>
		Math.min(
			Math.max(width, TOPIC_DETAIL_OUTLINE_MIN_WIDTH),
			TOPIC_DETAIL_OUTLINE_MAX_WIDTH
		)

	useEffect(() => {
		if (typeof window === 'undefined') return

		const updateViewportMetrics = () => {
			setViewportHeight(window.innerHeight)
			setOutlineTopOffset(
				outlineRef.current?.getBoundingClientRect().top ?? stickyTopOffset
			)
		}

		updateViewportMetrics()
		window.addEventListener('resize', updateViewportMetrics)

		return () => {
			window.removeEventListener('resize', updateViewportMetrics)
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
		if (typeof ResizeObserver === 'undefined') return

		const navElement = outlineNavRef.current
		const footerElement = footerRef.current

		if (!(navElement || footerElement)) return

		const updateMeasuredHeights = () => {
			setOutlineContentHeight(navElement?.scrollHeight ?? 0)
			setFooterHeight(footerElement?.getBoundingClientRect().height ?? 0)
		}

		const observer = new ResizeObserver(() => {
			updateMeasuredHeights()
		})

		if (navElement) observer.observe(navElement)
		if (footerElement) observer.observe(footerElement)

		updateMeasuredHeights()

		return () => {
			observer.disconnect()
		}
	}, [outlineNodes.length, rootLabel])

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

		const maxOutlineHeight = Math.max(
			viewportHeight - outlineTopOffset - stickyTopOffset,
			0
		)
		const desiredOutlineHeight = outlineContentHeight + footerHeight
		return {
			height:
				desiredOutlineHeight > 0
					? `${Math.min(desiredOutlineHeight, maxOutlineHeight)}px`
					: 'fit-content',
			maxHeight: `${maxOutlineHeight}px`
		}
	}, [footerHeight, outlineContentHeight, outlineTopOffset, viewportHeight])
	const outlineListStyle = useMemo<CSSProperties | undefined>(() => {
		if (viewportHeight <= stickyTopOffset) return
		if (outlineContentHeight <= 0 || footerHeight <= 0) return

		const maxOutlineHeight = Math.max(
			viewportHeight - outlineTopOffset - stickyTopOffset,
			0
		)
		const maxListHeight = Math.max(maxOutlineHeight - footerHeight, 0)

		return {
			height: `${Math.min(outlineContentHeight, maxListHeight)}px`
		}
	}, [footerHeight, outlineContentHeight, outlineTopOffset, viewportHeight])
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
						<nav
							aria-label='On this page'
							className='min-w-0 space-y-1.5'
							ref={outlineNavRef}
						>
							<ul className='space-y-px'>
								<ContextMenu>
									<li>
										<ContextMenuTrigger className='rounded-md'>
											<div
												className={cn(
													'group/topic-row flex min-h-7 items-center rounded-md pr-0.5 transition-colors hover:bg-[var(--app-chrome-hover)]'
												)}
											>
												<Link
													className={cn(
														'min-w-0 flex-1 truncate rounded-md px-1.5 py-1 text-left text-sm underline-offset-4 transition-colors hover:underline',
														isRootActive
															? 'font-medium text-foreground'
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
										renderPrimaryAction={renderOutlinePrimaryAction}
										suppressSelectionRef={suppressSelectionRef}
									/>
								))}
							</ul>
						</nav>
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

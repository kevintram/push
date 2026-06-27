import { Link } from '@tanstack/react-router'
import {
	type CSSProperties,
	type MouseEvent,
	type MutableRefObject,
	type ReactElement,
	type RefObject,
	useCallback,
	useMemo,
	useRef,
} from 'react'

import { TopicDetailOutlineHeader } from '~/app/pages/topic-detail/TopicDetailOutlineHeader'
import { cn } from '~/lib/utils'
import { TopicTreeItem } from '~/modules/topics/components/topic-tree/TopicTreeItem'
import { type TopicTreeNode } from '~/modules/topics/utils/topicTree'

import { getTopicDetailSectionId } from '../topic-detail/topicDetailStructure'

type LibraryOutlineContentProps = {
	ancestorIdsById: Map<number, Array<number>>
	collapseAll: () => void
	expandedIdSet: Set<number>
	freshTopicId: number | null
	isUpdatingTopic: boolean
	libraryRootNode: TopicTreeNode
	nodeById: Map<number, TopicTreeNode>
	onCreateRootTopic: () => Promise<void>
	onCreateSubtopic: (topicId: number) => Promise<void>
	onOpenTopic: (topicId: number) => void
	onRequestDeleteTopic: (topicId: number) => void
	onSectionSelect: (topicId: number) => void
	onToggleExpanded: (topicId: number) => void
	outlineHeaderRef: RefObject<HTMLDivElement | null>
	outlineListStyle: CSSProperties | undefined
	outlineNavRef: RefObject<HTMLElement | null>
	registerOutlineItemRef: (
		topicId: number,
		element: HTMLLIElement | null,
	) => void
	sectionNumberById: Map<number, string>
	suppressSelectionRef: MutableRefObject<boolean>
	visibleSectionIds: Array<number>
}

type OutlinePrimaryActionProps = {
	className: string
	label: string
	node: TopicTreeNode
	suppressSelectionRef: MutableRefObject<boolean>
}

function OutlineLabel({
	label,
	sectionNumber,
}: {
	label: string
	sectionNumber: string | null
}): ReactElement {
	const sectionNumberPrefix =
		sectionNumber == null ? null : (
			<span className='whitespace-nowrap font-medium text-[0.72rem] text-slate-400 tabular-nums leading-none tracking-[0.01em] dark:text-slate-500'>
				{sectionNumber}{' '}
			</span>
		)

	return (
		<span className='min-w-0 truncate'>
			{sectionNumberPrefix}
			<span>{label}</span>
		</span>
	)
}

function shouldHandleSamePageSectionNavigation(
	event: MouseEvent<HTMLAnchorElement>,
): boolean {
	return !(
		event.button !== 0 ||
		event.altKey ||
		event.ctrlKey ||
		event.metaKey ||
		event.shiftKey
	)
}

function getRootLinkClassName(isRootActive: boolean): string {
	if (isRootActive) {
		return 'font-bold text-foreground'
	}

	return 'font-semibold text-muted-foreground hover:text-foreground'
}

/**
 * TopicNavigator except library is set as a synthetic root.
 * (For use only on `/library` routes)
 */
export function LibraryOutlineContent({
	ancestorIdsById,
	collapseAll,
	expandedIdSet,
	freshTopicId,
	isUpdatingTopic,
	libraryRootNode,
	nodeById,
	onCreateRootTopic,
	onCreateSubtopic,
	onOpenTopic,
	onRequestDeleteTopic,
	onSectionSelect,
	onToggleExpanded,
	outlineHeaderRef,
	outlineListStyle,
	outlineNavRef,
	registerOutlineItemRef,
	sectionNumberById,
	suppressSelectionRef,
	visibleSectionIds,
}: LibraryOutlineContentProps): ReactElement {
	const outlineNodes = libraryRootNode.children
	const outlineScrollRef = useRef<HTMLDivElement>(null)
	const visibleOutlineTopicIds = useMemo(
		() => new Set(visibleSectionIds),
		[visibleSectionIds],
	)
	const freshOutlineTopicIds = useMemo(() => {
		if (freshTopicId === null) {
			return
		}

		return new Set([freshTopicId])
	}, [freshTopicId])
	const handleScrollToTop = useCallback(() => {
		outlineScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
	}, [outlineScrollRef])
	const handleOutlineClick = useCallback(
		(
			event: MouseEvent<HTMLAnchorElement>,
			topicId: number,
			suppressedRef: MutableRefObject<boolean>,
		) => {
			if (suppressedRef.current) {
				event.preventDefault()
				event.stopPropagation()
				return
			}

			if (!shouldHandleSamePageSectionNavigation(event)) return

			event.preventDefault()
			onSectionSelect(topicId)
		},
		[onSectionSelect],
	)
	const renderOutlinePrimaryAction = useCallback(
		({
			className,
			label,
			node,
			suppressSelectionRef: suppressedRef,
		}: OutlinePrimaryActionProps) => {
			function handleClick(event: MouseEvent<HTMLAnchorElement>): void {
				handleOutlineClick(event, node.id, suppressedRef)
			}

			return (
				<Link
					className={cn(className, 'w-full text-left')}
					hash={getTopicDetailSectionId(node.id)}
					hashScrollIntoView={false}
					onClick={handleClick}
					resetScroll={false}
					search={true}
					to='/library'
				>
					<OutlineLabel
						label={label}
						sectionNumber={sectionNumberById.get(node.id) ?? null}
					/>
				</Link>
			)
		},
		[handleOutlineClick, sectionNumberById],
	)
	const isRootActive = visibleOutlineTopicIds.has(libraryRootNode.id)
	const rootLinkClassName = cn(
		'group/topic-row flex min-h-7 items-center rounded-md px-1.5 py-1 text-left text-sm underline-offset-4 transition-colors hover:bg-[var(--app-chrome-hover)] hover:underline',
		getRootLinkClassName(isRootActive),
	)
	const rootHash = getTopicDetailSectionId(libraryRootNode.id)
	const rootTopicItems = outlineNodes.map(node => (
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
			onCreateSubtopic={onCreateSubtopic}
			onOpenTopic={onOpenTopic}
			onRequestDeleteTopic={onRequestDeleteTopic}
			onToggleExpanded={onToggleExpanded}
			renderPrimaryAction={renderOutlinePrimaryAction}
			setItemRef={registerOutlineItemRef}
			suppressSelectionRef={suppressSelectionRef}
		/>
	))

	function handleRootClick(event: MouseEvent<HTMLAnchorElement>): void {
		handleOutlineClick(event, libraryRootNode.id, suppressSelectionRef)
	}

	return (
		<div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
			<div
				className='min-h-0 min-w-0 shrink-0 pr-1'
				style={outlineListStyle}
			>
				<div className='h-full min-h-0 overflow-y-auto pr-2'>
					<div className='flex h-full min-h-0 flex-col'>
						<div className='mb-1.5 shrink-0' ref={outlineHeaderRef}>
							<TopicDetailOutlineHeader
								isUpdatingTopic={isUpdatingTopic}
								onAdd={onCreateRootTopic}
								onCollapseAll={collapseAll}
								onScrollToTop={handleScrollToTop}
							/>
						</div>
						<div
							className='min-h-0 flex-1 overflow-y-auto'
							ref={outlineScrollRef}
						>
							<nav
								aria-label='Library outline'
								className='min-w-0'
								ref={outlineNavRef}
							>
								<ul className='space-y-px'>
									<li>
										<Link
											className={rootLinkClassName}
											hash={rootHash}
											hashScrollIntoView={false}
											onClick={handleRootClick}
											resetScroll={false}
											search={true}
											to='/library'
										>
											<OutlineLabel
												label={libraryRootNode.title}
												sectionNumber={null}
											/>
										</Link>
									</li>
									{rootTopicItems}
								</ul>
							</nav>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

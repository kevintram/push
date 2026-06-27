import { useNavigate } from '@tanstack/react-router'
import { type ReactElement, useCallback } from 'react'

import { Separator } from '~/components/ui/separator'
import { type TopicTreeNode } from '~/modules/topics/utils/topicTree'

import { type TopicDetailReviewCardFilter } from '../topic-detail/shared'
import {
	TOPIC_DETAIL_OUTLINE_MAX_WIDTH,
	TOPIC_DETAIL_OUTLINE_MIN_WIDTH,
} from '../topic-detail/topicDetailLayout'
import { TopicDetailReviewCardFilterControls } from '../topic-detail/TopicDetailReviewCardControls'
import { useTopicDetailOutline } from '../topic-detail/useTopicDetailOutline'
import { useTopicDetailOutlineSizing } from '../topic-detail/useTopicDetailOutlineSizing'
import { LibraryOutlineContent } from './LibraryOutlineContent'
import { LibraryOutlineDeleteDialog } from './LibraryOutlineDeleteDialog'

type LibraryOutlineProps = {
	ancestorIdsById: Map<number, Array<number>>
	freshTopicId: number | null
	globalFilter: TopicDetailReviewCardFilter
	libraryRootNode: TopicTreeNode
	nodeById: Map<number, TopicTreeNode>
	onCreateRootTopic: () => Promise<void>
	onGlobalFilterChange: (filter: TopicDetailReviewCardFilter) => void
	onOutlineWidthChange: (width: number) => void
	onSectionSelect: (topicId: number) => void
	onSubtopicCreated: (parentTopicId: number, createdTopicId: number) => void
	outlineWidth: number
	pendingCreatedParentTopicId: number | null
	pendingCreatedTopicId: number | null
	sectionNumberById: Map<number, string>
	visibleSectionIds: Array<number>
}

export function LibraryOutline({
	ancestorIdsById,
	freshTopicId,
	globalFilter,
	libraryRootNode,
	nodeById,
	onCreateRootTopic,
	onGlobalFilterChange,
	onOutlineWidthChange,
	onSectionSelect,
	onSubtopicCreated,
	outlineWidth,
	pendingCreatedParentTopicId,
	pendingCreatedTopicId,
	sectionNumberById,
	visibleSectionIds,
}: LibraryOutlineProps): ReactElement {
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
		toggleExpanded,
	} = useTopicDetailOutline({
		ancestorIdsById,
		nodeById,
		onCreateSubtopicCreated: onSubtopicCreated,
		outlineRootNode: libraryRootNode,
		pendingCreatedParentTopicId,
		visibleSectionIds,
	})
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
		resizeButtonRef,
	} = useTopicDetailOutlineSizing({
		onOutlineWidthChange,
		outlineNodeCount: libraryRootNode.children.length,
		outlineWidth,
		pendingCreatedTopicId,
		rootLabel: libraryRootNode.title,
	})
	const handleOpenTopic = useCallback(
		(topicId: number) => {
			void navigate({
				to: '/topics/$topicId',
				params: { topicId: topicId.toString() },
			})
		},
		[navigate],
	)

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
			<LibraryOutlineContent
				ancestorIdsById={ancestorIdsById}
				collapseAll={collapseAll}
				expandedIdSet={expandedIdSet}
				freshTopicId={freshTopicId}
				isUpdatingTopic={isUpdatingTopic}
				libraryRootNode={libraryRootNode}
				nodeById={nodeById}
				onCreateRootTopic={onCreateRootTopic}
				onCreateSubtopic={handleCreateSubtopic}
				onOpenTopic={handleOpenTopic}
				onRequestDeleteTopic={setPendingDeleteTopicId}
				onSectionSelect={onSectionSelect}
				onToggleExpanded={toggleExpanded}
				outlineHeaderRef={outlineHeaderRef}
				outlineListStyle={outlineListStyle}
				outlineNavRef={outlineNavRef}
				registerOutlineItemRef={registerOutlineItemRef}
				sectionNumberById={sectionNumberById}
				suppressSelectionRef={suppressSelectionRef}
				visibleSectionIds={visibleSectionIds}
			/>
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
			<LibraryOutlineDeleteDialog
				isDeletingTopic={isDeletingTopic}
				onConfirmDeleteTopic={handleConfirmDeleteTopic}
				onOpenChange={handleDialogOpenChange}
				pendingDeleteTopic={pendingDeleteTopic ?? null}
				pendingDeleteTopicId={pendingDeleteTopicId}
			/>
		</aside>
	)
}

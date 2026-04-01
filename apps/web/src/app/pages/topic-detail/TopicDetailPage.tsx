import { notFound } from '@tanstack/react-router'
import { AlertTriangle, MoreHorizontal, Trash2 } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useState } from 'react'
import { LoadingOrError } from '~/components/LoadingOrError'
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
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { cn } from '~/lib/utils'
import { isHttpStatusError } from '~/utils/httpStatusError'
import type {
	TopicDetailReviewCardControlsVariant,
	TopicDetailReviewCardFilter
} from './shared'
import { TopicDetailHeader } from './TopicDetailHeader'
import { TopicDetailOutline } from './TopicDetailOutline'
import { TopicDetailRootSectionContent } from './TopicDetailRootSectionContent'
import {
	TOPIC_DETAIL_LEAF_CONTENT_RAIL_CLASS,
	TOPIC_DETAIL_OUTLINE_DEFAULT_WIDTH,
	TOPIC_DETAIL_OUTLINE_GUTTER_WIDTH_CLASS,
	TOPIC_DETAIL_PAGE_WITH_OUTLINE_GRID_CLASS,
	TOPIC_DETAIL_ROOT_CONTENT_MEASURE_CLASS,
	TOPIC_DETAIL_ROOT_HEADER_BAND_CLASS,
	TOPIC_DETAIL_SECTION_GRID_CLASS
} from './topicDetailLayout'
import { useTopicDetailPage } from './useTopicDetailPage'

interface TopicDetailPageProps {
	cardTypeFilter?: TopicDetailReviewCardFilter | string
	focusTitle?: boolean
	onCardTypeFilterChange: (filter: TopicDetailReviewCardFilter) => void
	reviewCardControlsVariant?: TopicDetailReviewCardControlsVariant
	topicId: number
}

export function TopicDetailPage({
	cardTypeFilter = 'all',
	focusTitle,
	onCardTypeFilterChange,
	reviewCardControlsVariant = 'medium',
	topicId
}: TopicDetailPageProps) {
	const [outlineWidth, setOutlineWidth] = useState(
		TOPIC_DETAIL_OUTLINE_DEFAULT_WIDTH
	)
	const {
		ancestorIdsById,
		collapsedSections,
		detailError,
		getScrollElement,
		handleDeleteTopic,
		handleGlobalFilterChange,
		handleOpenReviewCard,
		handleSectionFilterChange,
		isDeleteDialogOpen,
		isDeletingTopic,
		isDetailLoading,
		isReviewCardsLoading,
		nodeById,
		registerSectionHeadingRef,
		registerSectionRef,
		scrollToSection,
		registerScrollContainerRef,
		resolvedCardTypeFilter,
		rootSection,
		sectionFilterOverrides,
		setIsDeleteDialogOpen,
		shouldAutoFocusRootTitle,
		toggleSection,
		topic,
		topicPath,
		topicReviewCardsById,
		visibleSectionIds
	} = useTopicDetailPage({
		cardTypeFilter,
		focusTitle,
		onCardTypeFilterChange,
		topicId
	})

	if (isDetailLoading) {
		return (
			<div className='flex h-full min-h-0 w-full items-center justify-center'>
				<LoadingSpinner containerClassName='min-h-64' />
			</div>
		)
	}

	if (detailError) {
		if (isHttpStatusError(detailError) && detailError.status === 404) {
			throw notFound()
		}

		return (
			<LoadingOrError
				error={
					detailError instanceof Error
						? detailError
						: new Error('Failed to load topic')
				}
			/>
		)
	}

	if (!(topic && rootSection)) {
		throw notFound()
	}

	const isLeafTopic = rootSection.children.length === 0
	const pageStyle = isLeafTopic
		? undefined
		: ({
				'--topic-detail-outline-width': `${outlineWidth}px`
			} as CSSProperties)
	const rootHeaderContentClassName = isLeafTopic
		? undefined
		: TOPIC_DETAIL_ROOT_CONTENT_MEASURE_CLASS
	const rootHeaderActionClassName = isLeafTopic
		? 'top-0 right-0'
		: 'top-0 right-0 lg:hidden'
	const rootHeaderPathContainerClassName = isLeafTopic ? undefined : 'lg:pr-0'
	const rootHeaderTitleContainerClassName = isLeafTopic
		? 'pr-12 sm:pr-14'
		: 'pr-12 sm:pr-14 lg:pr-0'
	const rootSectionContent = (
		<TopicDetailRootSectionContent
			collapsedSections={collapsedSections}
			getScrollElement={getScrollElement}
			globalFilter={resolvedCardTypeFilter}
			isReviewCardsLoading={isReviewCardsLoading}
			onGlobalFilterChange={handleGlobalFilterChange}
			onOpenReviewCard={handleOpenReviewCard}
			onSectionFilterChange={handleSectionFilterChange}
			registerSectionHeadingRef={registerSectionHeadingRef}
			registerSectionRef={registerSectionRef}
			resolvedFilterByTopicId={sectionFilterOverrides}
			reviewCardControlsVariant={reviewCardControlsVariant}
			rootTopicPath={topicPath}
			searchFilter={resolvedCardTypeFilter}
			section={rootSection}
			toggleSection={toggleSection}
			topicReviewCardsById={topicReviewCardsById}
		/>
	)

	return (
		<div className='flex h-full min-h-0 w-full' style={pageStyle}>
			<div className='flex min-h-0 min-w-0 flex-1 flex-col'>
				<div
					className='flex-1 overflow-y-auto scroll-smooth'
					ref={registerScrollContainerRef}
				>
					<div className={TOPIC_DETAIL_ROOT_HEADER_BAND_CLASS}>
						<div className='mx-auto w-full max-w-[76rem]'>
							<div
								className={cn(
									'grid gap-6 px-5 pt-9 pb-7 sm:px-7 sm:pt-10 sm:pb-8 xl:gap-6 xl:px-8 xl:pt-11 xl:pb-8',
									!isLeafTopic && TOPIC_DETAIL_PAGE_WITH_OUTLINE_GRID_CLASS
								)}
							>
								<div
									className={cn(
										'min-w-0',
										isLeafTopic && TOPIC_DETAIL_LEAF_CONTENT_RAIL_CLASS
									)}
								>
									<div className='flex items-start gap-3'>
										<div className='min-w-0 flex-1'>
											<div className={TOPIC_DETAIL_SECTION_GRID_CLASS}>
												<div className='relative min-w-0'>
													<div
														className='relative z-10 scroll-mt-24'
														data-topic-detail-heading-id={rootSection.topic.id}
														ref={element => {
															registerSectionHeadingRef(
																rootSection.topic.id,
																element
															)
														}}
													>
														<TopicDetailHeader
															actionClassName={rootHeaderActionClassName}
															contentClassName={rootHeaderContentClassName}
															onOpenDeleteDialog={() =>
																setIsDeleteDialogOpen(true)
															}
															pathContainerClassName={
																rootHeaderPathContainerClassName
															}
															shouldAutoFocusTitle={shouldAutoFocusRootTitle}
															titleContainerClassName={
																rootHeaderTitleContainerClassName
															}
															topic={rootSection.topic}
															topicPath={topicPath}
														/>
													</div>
												</div>
											</div>
										</div>
										<div
											className={cn(
												'hidden shrink-0 items-start lg:flex',
												isLeafTopic && 'lg:hidden'
											)}
										>
											<DropdownMenu>
												<DropdownMenuTrigger
													render={
														<Button
															aria-label={`More actions for ${rootSection.topic.title || 'Untitled topic'}`}
															className='h-8 w-8 shrink-0 rounded-full'
															size='icon-sm'
															variant='outline'
														>
															<MoreHorizontal className='h-4 w-4' />
														</Button>
													}
												/>
												<DropdownMenuContent
													align='end'
													side='bottom'
													sideOffset={4}
												>
													<DropdownMenuItem
														onClick={() => setIsDeleteDialogOpen(true)}
														variant='destructive'
													>
														<Trash2 className='mr-2 h-4 w-4' />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className='mx-auto flex w-full max-w-[76rem] items-start gap-5 px-2 pt-4 pb-5 sm:px-7 xl:gap-6 xl:px-8 xl:pt-5 xl:pb-6'>
						<div
							className={cn(
								'min-w-0 flex-1 space-y-5',
								isLeafTopic && TOPIC_DETAIL_LEAF_CONTENT_RAIL_CLASS
							)}
						>
							{rootSectionContent}
						</div>
						{isLeafTopic ? null : (
							<div
								className={cn(
									'hidden shrink-0 self-start lg:sticky lg:top-6 lg:flex lg:justify-start',
									TOPIC_DETAIL_OUTLINE_GUTTER_WIDTH_CLASS
								)}
							>
								<TopicDetailOutline
									ancestorIdsById={ancestorIdsById}
									globalFilter={resolvedCardTypeFilter}
									nodeById={nodeById}
									onGlobalFilterChange={handleGlobalFilterChange}
									onOutlineWidthChange={setOutlineWidth}
									onSectionSelect={scrollToSection}
									outlineRootNode={rootSection.topic}
									outlineWidth={outlineWidth}
									visibleSectionIds={visibleSectionIds}
								/>
							</div>
						)}
					</div>
				</div>
			</div>
			<AlertDialog
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
			>
				<AlertDialogContent size='sm'>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<AlertTriangle className='h-5 w-5' />
						</AlertDialogMedia>
						<AlertDialogTitle>Delete topic?</AlertDialogTitle>
						<AlertDialogDescription>
							This will delete this topic, all subtopics, and all linked review
							cards and reviews. This action cannot be undone.
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
							onClick={() => {
								handleDeleteTopic().catch(() => {})
							}}
						>
							{isDeletingTopic ? 'Deleting...' : 'Delete topic'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

export type {
	TopicDetailReviewCardControlsVariant,
	TopicDetailReviewCardFilter
} from './shared'

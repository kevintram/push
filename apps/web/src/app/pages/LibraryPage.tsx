import { notFound, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import {
	type CSSProperties,
	type ReactElement,
	useEffect,
	useRef,
	useState
} from 'react'
import { LoadingOrError } from '~/components/LoadingOrError'
import { Button } from '~/components/ui/button'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { cn } from '~/lib/utils'
import { isHttpStatusError } from '~/utils/httpStatusError'
import { LibraryOutline } from './library/LibraryOutline'
import { useLibraryPage } from './library/useLibraryPage'
import type { TopicDetailReviewCardFilter } from './topic-detail/shared'
import { TopicDetailSection } from './topic-detail/TopicDetailSection'
import {
	TOPIC_DETAIL_OUTLINE_DEFAULT_WIDTH,
	TOPIC_DETAIL_OUTLINE_GUTTER_WIDTH_CLASS,
	TOPIC_DETAIL_PAGE_WITH_OUTLINE_GRID_CLASS,
	TOPIC_DETAIL_ROOT_CONTENT_MEASURE_CLASS,
	TOPIC_DETAIL_ROOT_HEADER_BAND_CLASS,
	TOPIC_DETAIL_SECTION_GRID_CLASS
} from './topic-detail/topicDetailLayout'
import {
	getTopicDetailIndicatorLayout,
	getTopicDetailRootPresentation
} from './topic-detail/topicDetailTheme'

type LibraryPageProps = {
	create?: boolean
}

function getLibraryLoadError(detailError: unknown): Error {
	return detailError instanceof Error
		? detailError
		: new Error('Failed to load library')
}

function getLibraryPageStyle(
	outlineWidth: number
): CSSProperties & Record<string, string> {
	const indicatorLayout = getTopicDetailIndicatorLayout()

	return {
		'--topic-detail-outline-width': `${outlineWidth}px`,
		'--topic-detail-indicator-gap': indicatorLayout.indicatorGap,
		'--topic-detail-indicator-width': indicatorLayout.indicatorWidth
	}
}

export function LibraryPage({ create }: LibraryPageProps): ReactElement {
	const navigate = useNavigate()
	const [cardTypeFilter, setCardTypeFilter] =
		useState<TopicDetailReviewCardFilter>('all')
	const [outlineWidth, setOutlineWidth] = useState(
		TOPIC_DETAIL_OUTLINE_DEFAULT_WIDTH
	)
	const handledCreateIntentRef = useRef(false)
	const {
		ancestorIdsById,
		collapsedSections,
		detailError,
		freshTopicId,
		getScrollElement,
		handleCreateRootTopic,
		handleFreshTopicInteraction,
		handleGlobalFilterChange,
		handleOpenReviewCard,
		handleSectionFilterChange,
		handleSubtopicCreated,
		isCreatingTopic,
		isDetailLoading,
		isReviewCardsLoading,
		libraryRootNode,
		nodeById,
		pendingCreatedParentTopicId,
		pendingCreatedTopicId,
		preserveSectionOffset,
		registerScrollContainerRef,
		registerSectionHeadingRef,
		registerSectionRef,
		registerSectionTitleRef,
		resolvedCardTypeFilter,
		rootSections,
		scrollToSection,
		sectionFilterOverrides,
		sectionNumberById,
		toggleSection,
		topicReviewCardsById,
		visibleSectionIds
	} = useLibraryPage({
		cardTypeFilter,
		onCardTypeFilterChange: setCardTypeFilter
	})

	useEffect(() => {
		if (!create) {
			handledCreateIntentRef.current = false
			return
		}

		if (handledCreateIntentRef.current) return
		handledCreateIntentRef.current = true
		void navigate({
			to: '/library',
			replace: true,
			search: {}
		})
		void handleCreateRootTopic()
	}, [create, handleCreateRootTopic, navigate])

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

		return <LoadingOrError error={getLibraryLoadError(detailError)} />
	}

	const pageStyle = getLibraryPageStyle(outlineWidth)
	const rootPresentation = getTopicDetailRootPresentation()

	return (
		<div className='flex h-full min-h-0 w-full' style={pageStyle}>
			<div className='flex min-h-0 min-w-0 flex-1 flex-col'>
				<div
					className='flex-1 overflow-y-auto scroll-smooth'
					ref={registerScrollContainerRef}
				>
					<div
						className={cn(
							TOPIC_DETAIL_ROOT_HEADER_BAND_CLASS,
							rootPresentation.rootHeaderBandClassName
						)}
					>
						<div className='mx-auto w-full max-w-[76rem]'>
							<div
								className={cn(
									'grid gap-6 px-5 pt-9 pb-7 sm:px-7 sm:pt-10 sm:pb-8 xl:gap-6 xl:px-8 xl:pt-11 xl:pb-8',
									TOPIC_DETAIL_PAGE_WITH_OUTLINE_GRID_CLASS
								)}
							>
								<section
									className='min-w-0 scroll-mt-24'
									ref={element => {
										registerSectionRef(libraryRootNode.id, element)
									}}
								>
									<div
										className='relative z-10 min-w-0'
										data-topic-detail-heading-id={libraryRootNode.id}
										ref={element => {
											registerSectionHeadingRef(libraryRootNode.id, element)
										}}
									>
										<div className={TOPIC_DETAIL_SECTION_GRID_CLASS}>
											<div aria-hidden='true' />
											<div className='min-w-0'>
												<div
													className={TOPIC_DETAIL_ROOT_CONTENT_MEASURE_CLASS}
												>
													<div className='pr-12 sm:pr-14 lg:pr-0'>
														<h1
															className={cn(
																'min-w-0 break-words',
																rootPresentation.rootTitleClassName
															)}
														>
															Library
														</h1>
													</div>
												</div>
											</div>
										</div>
									</div>
								</section>
								<div className='flex items-start justify-end'>
									<Button
										disabled={isCreatingTopic}
										onClick={() => {
											void handleCreateRootTopic()
										}}
									>
										<Plus />
										New topic
									</Button>
								</div>
							</div>
						</div>
					</div>
					<div className='mx-auto flex w-full max-w-[76rem] items-start gap-5 px-2 pt-4 pb-5 sm:px-7 xl:gap-6 xl:px-8 xl:pt-5 xl:pb-6'>
						<div className='min-w-0 flex-1 space-y-5'>
							{rootSections.length === 0 ? (
								<div className='flex min-h-48 items-center justify-center rounded-2xl border border-border/70 border-dashed bg-background/60 px-6 text-center text-muted-foreground'>
									Create a topic to start building your library.
								</div>
							) : (
								rootSections.map(section => (
									<TopicDetailSection
										collapsedSections={collapsedSections}
										freshTopicId={freshTopicId}
										getScrollElement={getScrollElement}
										globalFilter={resolvedCardTypeFilter}
										isReviewCardsLoading={isReviewCardsLoading}
										key={section.topic.id}
										onFreshTopicInteraction={handleFreshTopicInteraction}
										onOpenReviewCard={handleOpenReviewCard}
										onPreserveSectionOffset={preserveSectionOffset}
										onSectionFilterChange={handleSectionFilterChange}
										onSubtopicCreated={handleSubtopicCreated}
										registerSectionHeadingRef={registerSectionHeadingRef}
										registerSectionRef={registerSectionRef}
										registerSectionTitleRef={registerSectionTitleRef}
										resolvedFilterByTopicId={sectionFilterOverrides}
										reviewCardControlsVariant='medium'
										searchFilter={resolvedCardTypeFilter}
										section={section}
										toggleSection={toggleSection}
										topicReviewCardsById={topicReviewCardsById}
									/>
								))
							)}
						</div>
						<div
							className={cn(
								'hidden shrink-0 self-start lg:sticky lg:top-6 lg:flex lg:justify-start',
								TOPIC_DETAIL_OUTLINE_GUTTER_WIDTH_CLASS
							)}
						>
							<LibraryOutline
								ancestorIdsById={ancestorIdsById}
								freshTopicId={freshTopicId}
								globalFilter={resolvedCardTypeFilter}
								libraryRootNode={libraryRootNode}
								nodeById={nodeById}
								onCreateRootTopic={handleCreateRootTopic}
								onGlobalFilterChange={handleGlobalFilterChange}
								onOutlineWidthChange={setOutlineWidth}
								onSectionSelect={scrollToSection}
								onSubtopicCreated={handleSubtopicCreated}
								outlineWidth={outlineWidth}
								pendingCreatedParentTopicId={pendingCreatedParentTopicId}
								pendingCreatedTopicId={pendingCreatedTopicId}
								sectionNumberById={sectionNumberById}
								visibleSectionIds={visibleSectionIds}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

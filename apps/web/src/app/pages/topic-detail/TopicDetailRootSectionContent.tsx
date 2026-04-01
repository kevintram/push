import type { ReviewCard as ReviewCardModel } from '~/features/review-cards/types/review-card.types'
import type {
	TopicDetailReviewCardControlsVariant,
	TopicDetailReviewCardFilter
} from './shared'
import type { TopicPathItem } from './TopicDetailBreadcrumb'
import { TopicDetailSection } from './TopicDetailSection'
import { TOPIC_DETAIL_SECTION_GRID_CLASS } from './topicDetailLayout'
import {
	getTopicDetailLabel,
	type TopicDetailSectionNode
} from './topicDetailStructure'
import { useTopicDetailSectionPanels } from './useTopicDetailSectionPanels'

type TopicDetailRootSectionContentProps = {
	collapsedSections: Record<string, boolean>
	freshTopicId: number | null
	getScrollElement: () => HTMLDivElement | null
	globalFilter: TopicDetailReviewCardFilter
	onGlobalFilterChange: (filter: TopicDetailReviewCardFilter) => void
	onFreshTopicInteraction: (topicId: number) => void
	onOpenReviewCard: (reviewCardId: number) => void
	onSubtopicCreated: (parentTopicId: number, createdTopicId: number) => void
	onSectionFilterChange: (
		topicId: number,
		filter: TopicDetailReviewCardFilter
	) => void
	isReviewCardsLoading: boolean
	registerSectionHeadingRef: (
		topicId: number,
		element: HTMLElement | null
	) => void
	registerSectionTitleRef: (
		topicId: number,
		element: HTMLTextAreaElement | null
	) => void
	registerSectionRef: (topicId: number, element: HTMLElement | null) => void
	resolvedFilterByTopicId: Record<number, TopicDetailReviewCardFilter>
	reviewCardControlsVariant: TopicDetailReviewCardControlsVariant
	rootTopicPath: Array<TopicPathItem>
	searchFilter: TopicDetailReviewCardFilter
	section: TopicDetailSectionNode
	toggleSection: (sectionId: string) => void
	topicReviewCardsById: Map<number, Array<ReviewCardModel>>
}

export function TopicDetailRootSectionContent({
	collapsedSections,
	freshTopicId,
	getScrollElement,
	globalFilter,
	onGlobalFilterChange,
	onFreshTopicInteraction,
	onOpenReviewCard,
	onSubtopicCreated,
	onSectionFilterChange,
	isReviewCardsLoading,
	registerSectionHeadingRef,
	registerSectionTitleRef,
	registerSectionRef,
	resolvedFilterByTopicId,
	reviewCardControlsVariant,
	rootTopicPath,
	searchFilter,
	section,
	toggleSection,
	topicReviewCardsById
}: TopicDetailRootSectionContentProps) {
	const sectionLabel = getTopicDetailLabel(
		section.topic.title,
		section.topic.body
	)
	const resolvedSectionFilter =
		resolvedFilterByTopicId[section.topic.id] ?? globalFilter
	const { bodyPanel, reviewCardsSection } = useTopicDetailSectionPanels({
		getScrollElement,
		onFilterChange: onGlobalFilterChange,
		onOpenReviewCard,
		reviewCardControlsVariant,
		resolvedSectionFilter,
		section,
		sectionLabel,
		isReviewCardsLoading,
		topicReviewCardsById
	})

	return (
		<section
			className='scroll-mt-24 space-y-0 py-0.5'
			ref={element => {
				registerSectionRef(section.topic.id, element)
			}}
		>
			<div className={TOPIC_DETAIL_SECTION_GRID_CLASS}>
				<div aria-hidden='true' />
				<div className='min-w-0'>
					<div>{bodyPanel}</div>
					<div>{reviewCardsSection}</div>
				</div>
			</div>
			{section.children.length > 0 ? (
				<div>
					{section.children.map(childSection => (
						<TopicDetailSection
							collapsedSections={collapsedSections}
							freshTopicId={freshTopicId}
							getScrollElement={getScrollElement}
							globalFilter={globalFilter}
							isReviewCardsLoading={isReviewCardsLoading}
							key={childSection.topic.id}
							onFreshTopicInteraction={onFreshTopicInteraction}
							onOpenReviewCard={onOpenReviewCard}
							onSectionFilterChange={onSectionFilterChange}
							onSubtopicCreated={onSubtopicCreated}
							registerSectionHeadingRef={registerSectionHeadingRef}
							registerSectionRef={registerSectionRef}
							registerSectionTitleRef={registerSectionTitleRef}
							resolvedFilterByTopicId={resolvedFilterByTopicId}
							reviewCardControlsVariant={reviewCardControlsVariant}
							rootTopicPath={rootTopicPath}
							searchFilter={searchFilter}
							section={childSection}
							toggleSection={toggleSection}
							topicReviewCardsById={topicReviewCardsById}
						/>
					))}
				</div>
			) : null}
		</section>
	)
}

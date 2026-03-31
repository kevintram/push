import { useNavigate } from '@tanstack/react-router'
import { Clock } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { ReviewCard } from '~/features/review-cards/components/ReviewCard'
import { useSearchAll } from '~/features/search/api/searchAll'
import { TopicCard } from '~/features/topics/components/TopicCard'
import {
	DEFAULT_MASONRY_GAP,
	DEFAULT_MASONRY_MIN_ITEM_WIDTH,
	estimateReviewCardSize,
	estimateTopicCardSize
} from '~/utils/estimateMasonryItemSize'
import { groupByDate, toEntityEntries } from '~/utils/groupByDate'

const RECENT_LIMIT = 50

function filterToEntityTypes(
	filter: EntityTypeFilterValue
): string | undefined {
	if (filter === 'all') return
	if (filter === 'topic') return 'topic'
	if (filter === 'practice') return 'practice'
	return 'flashcard'
}

export function RecentPage() {
	const navigate = useNavigate()
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')

	const { data: searchResults = [], isLoading } = useSearchAll({
		limit: RECENT_LIMIT,
		entityTypes: filterToEntityTypes(activeFilter)
	})

	const sections = useMemo(
		() => groupByDate(toEntityEntries(searchResults)),
		[searchResults]
	)

	let body: ReactNode
	if (isLoading) {
		body = <LoadingSpinner containerClassName='min-h-64' />
	} else if (sections.length === 0) {
		body = (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<Clock />
					</EmptyMedia>
					<EmptyTitle>No recent items</EmptyTitle>
					<EmptyDescription>
						See your most recently edited topics and review cards
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)
	} else {
		body = (
			<div className='space-y-6'>
				{sections.map(section => (
					<div className='space-y-3' key={section.id}>
						<h3 className='font-bold text-xl'>{section.label}</h3>
						<MasonryLayout
							estimateItemSize={(item, _index, laneWidth) => {
								if (item.entity_type === 'topic' && item.topic) {
									return estimateTopicCardSize(item.topic, laneWidth)
								}
								if (item.entity_type === 'review_card' && item.review_card) {
									return estimateReviewCardSize(item.review_card, laneWidth)
								}
								return 120
							}}
							gap={DEFAULT_MASONRY_GAP}
							getItemKey={item =>
								item.entity_type === 'topic'
									? `topic-${item.topic?.id ?? 'unknown'}`
									: `review-card-${item.review_card?.id ?? 'unknown'}`
							}
							items={section.items}
							minItemWidth={DEFAULT_MASONRY_MIN_ITEM_WIDTH}
							renderItem={item => {
								const topic = item.topic
								const reviewCard = item.review_card

								if (item.entity_type === 'topic' && topic) {
									return (
										<TopicCard
											onClick={() =>
												navigate({
													to: '/topics/$topicId',
													params: { topicId: topic.id.toString() }
												})
											}
											topic={topic}
										/>
									)
								}

								if (item.entity_type === 'review_card' && reviewCard) {
									return (
										<ReviewCard
											onClick={() =>
												navigate({
													to: '/review-cards/$reviewCardId',
													params: {
														reviewCardId: reviewCard.id.toString()
													},
													search: { tab: 'home' }
												})
											}
											reviewCard={reviewCard}
										/>
									)
								}

								return null
							}}
						/>
					</div>
				))}
			</div>
		)
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={Clock} title='Recent' />
			<PageLayout.Content className='max-w-screen space-y-3 px-2.5 py-2.5 pb-4'>
				<EntityTypeFilter
					activeFilter={activeFilter}
					onFilterChange={setActiveFilter}
				/>
				{body}
			</PageLayout.Content>
		</PageLayout>
	)
}

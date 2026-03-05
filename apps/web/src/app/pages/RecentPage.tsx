import { useNavigate } from '@tanstack/react-router'
import { Clock } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
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
import type { SearchResultItem } from '~/features/search/types/search.types'
import { TopicCard } from '~/features/topics/components/TopicCard'

const RECENT_LIMIT = 50

type DateSection = {
	id: string
	label: string
	items: Array<SearchResultItem>
}

function filterToEntityTypes(
	filter: EntityTypeFilterValue
): string | undefined {
	if (filter === 'all') return
	if (filter === 'topic') return 'topic'
	if (filter === 'practice') return 'practice'
	return 'flashcard'
}

function groupRecentByDate(items: Array<SearchResultItem>): Array<DateSection> {
	const now = new Date()
	now.setHours(0, 0, 0, 0)

	const byKey = new Map<string, DateSection>()
	for (const item of items) {
		const date = new Date(item.recent_activity_at)
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
		const existing = byKey.get(key)
		if (existing) {
			existing.items.push(item)
			continue
		}

		const normalized = new Date(date)
		normalized.setHours(0, 0, 0, 0)
		const diffDays = Math.floor(
			(now.getTime() - normalized.getTime()) / (1000 * 60 * 60 * 24)
		)
		let label = `${diffDays}d ago`
		if (diffDays <= 0) {
			label = 'Today'
		} else if (diffDays === 1) {
			label = 'Yesterday'
		}
		byKey.set(key, { id: key, label, items: [item] })
	}

	return [...byKey.values()].sort((a, b) => (a.id < b.id ? 1 : -1))
}

export function RecentPage() {
	const navigate = useNavigate()
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')

	const { data: searchResults = [], isLoading } = useSearchAll({
		limit: RECENT_LIMIT,
		entityTypes: filterToEntityTypes(activeFilter)
	})

	const sections = useMemo(
		() => groupRecentByDate(searchResults),
		[searchResults]
	)

	let content: ReactNode
	if (isLoading) {
		content = (
			<PageLayout.Content className='max-w-screen p-6'>
				<LoadingSpinner containerClassName='min-h-64' />
			</PageLayout.Content>
		)
	} else if (sections.length === 0) {
		content = (
			<PageLayout.Content>
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
			</PageLayout.Content>
		)
	} else {
		content = (
			<PageLayout.Content className='max-w-screen space-y-6 p-6'>
				{sections.map(section => (
					<div className='space-y-3' key={section.id}>
						<h3 className='font-bold text-xl'>{section.label}</h3>
						<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
							{section.items.map(item => {
								const topic = item.topic
								const reviewCard = item.review_card

								if (item.entity_type === 'topic' && topic) {
									return (
										<TopicCard
											key={`topic-${topic.id}`}
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
											key={`review-card-${reviewCard.id}`}
											onClick={() =>
												navigate({
													to: '/review-cards/$reviewCardId',
													params: {
														reviewCardId: reviewCard.id.toString()
													}
												})
											}
											readOnly={true}
											reviewCard={reviewCard}
										/>
									)
								}

								return null
							})}
						</div>
					</div>
				))}
			</PageLayout.Content>
		)
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={Clock} title='Recent'>
				<EntityTypeFilter
					activeFilter={activeFilter}
					onFilterChange={setActiveFilter}
				/>
			</PageLayout.Header>
			{content}
		</PageLayout>
	)
}

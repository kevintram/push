import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Home } from 'lucide-react'
import { useCallback } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import { SearchResultsContainer } from '~/components/search/SearchResultsContainer'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { AddTopicCard } from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicCard'
import { useAddTopicToReview } from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicToReviewContext'
import { useTopics } from '~/features/topics/api/getTopics'
import { useSearchTopics } from '~/features/topics/api/searchTopics'
import { useTopicsList } from '~/features/topics/hooks/useTopicsList'
import type { Topic } from '~/features/topics/types/topic.types'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'

export const Route = createFileRoute('/reviews/$reviewId_/add/')({
	component: IndexComponent
})

function IndexComponent() {
	const { q } = useSearch({ from: '/reviews/$reviewId_/add' })
	const { reviewId } = Route.useParams()
	const navigate = Route.useNavigate()

	const { review } = useAddTopicToReview()

	const debouncedQuery = useDebouncedValue(q, 300)
	const trimmedQuery = debouncedQuery?.trim() ?? ''
	const hasQuery = trimmedQuery.length > 0

	// Search Logic
	const { data: searchResults = [], isLoading: isSearching } = useSearchTopics({
		query: trimmedQuery || undefined,
		limit: 20,
		enabled: !!review && hasQuery
	})

	// Root Topics Logic
	const { data: rootTopics = [], isLoading: isLoadingRoot } = useTopics(
		{
			root: true,
			archived: false,
			inboxed: false
		},
		{ enabled: !hasQuery }
	)

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			navigate({
				to: '/reviews/$reviewId/add/topics/$topicId',
				params: { reviewId, topicId: topic.id.toString() },
				search: old => old
			})
		},
		[navigate, reviewId]
	)

	if (hasQuery) {
		return (
			<SearchResultsContainer
				estimateItemSize={topic => {
					const nameLines = Math.ceil((topic.name?.length || 8) / 40)
					const notesLines = topic.notes
						? Math.min(2, Math.ceil(topic.notes.length / 40))
						: 0
					return Math.max(
						72, // MIN_HEIGHT
						80 + (nameLines - 1) * 20 + notesLines * 20
					)
				}}
				getItemKey={topic => topic.id}
				hasQuery={hasQuery}
				isLoading={isSearching}
				renderItem={topic => (
					<AddTopicCard
						onCardClick={() => handleTopicClick(topic)}
						searchQuery={hasQuery ? (q ?? '') : ''}
						topic={topic}
					/>
				)}
				results={searchResults}
				searchQuery={q ?? ''}
			/>
		)
	}

	return (
		<RootTopicsList
			isLoading={isLoadingRoot}
			onTopicClick={handleTopicClick}
			topics={rootTopics}
		/>
	)
}

function RootTopicsList({
	topics,
	onTopicClick,
	isLoading
}: {
	topics: Array<Topic>
	onTopicClick: (topic: Topic) => void
	isLoading: boolean
}) {
	const { estimateItemSize, renderItem, getItemKey } = useTopicsList({
		minHeight: 96,
		onTopicClick
	})

	if (isLoading) {
		return <MasonryLayoutSkeleton />
	}

	if (topics.length === 0) {
		return (
			<div className='p-4'>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<Home />
						</EmptyMedia>
						<EmptyTitle>
							Topics are anything you want to learn or remember.
						</EmptyTitle>
					</EmptyHeader>
				</Empty>
			</div>
		)
	}

	return (
		<div className='p-6'>
			<MasonryLayout
				estimateItemSize={estimateItemSize}
				gap={16}
				getItemKey={getItemKey}
				items={topics}
				minItemWidth={280}
				renderItem={renderItem}
			/>
		</div>
	)
}

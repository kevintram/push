import { createFileRoute } from '@tanstack/react-router'
import { Home } from 'lucide-react'
import { useCallback } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import { MIN_HEIGHT } from '~/components/search/constants'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { AddTopicCard } from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicCard'
import { useTopics } from '~/features/topics/api/getTopics'
import type { Topic } from '~/features/topics/types/topic.types'

export const Route = createFileRoute(
	'/review-session/$reviewSessionId_/add/_list/'
)({
	component: IndexComponent
})

function IndexComponent() {
	const navigate = Route.useNavigate()
	const { reviewSessionId } = Route.useParams()

	// Root Topics Logic
	const { data: rootTopics = [], isLoading: isLoadingRoot } = useTopics({
		root: true,
		archived: false,
		inboxed: false
	})

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			navigate({
				to: '/review-session/$reviewSessionId/add/topics/$topicId',
				params: { reviewSessionId, topicId: topic.id.toString() }
			})
		},
		[navigate, reviewSessionId]
	)

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
	const estimateItemSize = useCallback((topic: Topic) => {
		const nameLines = Math.ceil((topic.name?.length || 8) / 40)
		const notesLines = topic.notes
			? Math.min(2, Math.ceil(topic.notes.length / 40))
			: 0
		return Math.max(MIN_HEIGHT, 80 + (nameLines - 1) * 20 + notesLines * 20)
	}, [])

	const getItemKey = useCallback((topic: Topic) => topic.id, [])

	const renderAddTopicCard = useCallback(
		(topic: Topic) => (
			<AddTopicCard onCardClick={() => onTopicClick(topic)} topic={topic} />
		),
		[onTopicClick]
	)

	if (isLoading) {
		return <MasonryLayoutSkeleton />
	}

	if (topics.length === 0) {
		return (
			<div>
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
		<MasonryLayout
			estimateItemSize={estimateItemSize}
			gap={16}
			getItemKey={getItemKey}
			items={topics}
			minItemWidth={280}
			renderItem={renderAddTopicCard}
		/>
	)
}

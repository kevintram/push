import { createFileRoute } from '@tanstack/react-router'
import { Inbox } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import { MIN_HEIGHT } from '~/components/search/constants'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { AddTopicCard } from '~/features/reviews/components/AddTopicToReviewDialog/AddTopicCard'
import { useTopics } from '~/features/topics/api/getTopics'
import type { Topic } from '~/features/topics/types/topic.types'

export const Route = createFileRoute(
	'/review-session/$reviewSessionId_/add/_list/inbox'
)({
	component: InboxComponent
})

function InboxComponent() {
	const navigate = Route.useNavigate()
	const { reviewSessionId } = Route.useParams()

	const { data: topics, isLoading } = useTopics({
		inboxed: true,
		archived: false
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
		<InboxList
			isLoading={isLoading}
			onTopicClick={handleTopicClick}
			topics={topics}
		/>
	)
}

function InboxList({
	topics,
	onTopicClick,
	isLoading
}: {
	topics: Array<Topic> | undefined | null
	onTopicClick: (topic: Topic) => void
	isLoading: boolean
}) {
	const topicList = useMemo<Array<Topic>>(() => topics ?? [], [topics])

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

	if (topicList.length === 0) {
		return (
			<div>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<Inbox />
						</EmptyMedia>
						<EmptyTitle>Your inbox is empty.</EmptyTitle>
						<EmptyDescription>
							The inbox is for topics to be processed later. Fleeting notes,
							sudden ideas, whatever.
						</EmptyDescription>
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
			items={topicList}
			minItemWidth={280}
			renderItem={renderAddTopicCard}
		/>
	)
}

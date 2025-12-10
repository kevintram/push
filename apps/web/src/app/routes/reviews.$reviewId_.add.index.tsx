import { createFileRoute } from '@tanstack/react-router'
import { Home } from 'lucide-react'
import { useCallback } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useTopics } from '~/features/topics/api/getTopics'
import { useTopicsList } from '~/features/topics/hooks/useTopicsList'
import type { Topic } from '~/features/topics/types/topic.types'

export const Route = createFileRoute('/reviews/$reviewId_/add/')({
	component: IndexComponent
})

function IndexComponent() {
	const navigate = Route.useNavigate()
	const { reviewId } = Route.useParams()

	// Root Topics Logic
	const { data: rootTopics = [], isLoading: isLoadingRoot } = useTopics({
		root: true,
		archived: false,
		inboxed: false
	})

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			navigate({
				to: '/reviews/$reviewId/add/topics/$topicId',
				params: { reviewId, topicId: topic.id.toString() }
			})
		},
		[navigate, reviewId]
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

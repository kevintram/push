import { useNavigate } from '@tanstack/react-router'
import { History } from 'lucide-react'
import { useCallback } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useTopics } from '~/features/topics/api/getTopics'
import { useTopicsList } from '~/features/topics/hooks/useTopicsList'
import type { Topic } from '~/features/topics/types/topic.types'

export function RecentPage() {
	const navigate = useNavigate()

	// Fetch 50 most recent topics
	const { data: topics = [], isLoading } = useTopics({
		order: 'desc',
		limit: 50
	})

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: topic.id.toString() }
			})
		},
		[navigate]
	)

	return (
		<PageLayout>
			<PageLayout.Header icon={History} title='Recent' />
			<RecentList
				isLoading={isLoading}
				onTopicClick={handleTopicClick}
				topics={topics}
			/>
		</PageLayout>
	)
}

function RecentList({
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
			<PageLayout.Content>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<History />
						</EmptyMedia>
						<EmptyTitle>No recent topics</EmptyTitle>
						<EmptyDescription>
							See your most recently edited topics
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</PageLayout.Content>
		)
	}

	return (
		<PageLayout.Content className='max-w-screen p-6'>
			<MasonryLayout
				estimateItemSize={estimateItemSize}
				gap={16}
				getItemKey={getItemKey}
				items={topics}
				minItemWidth={280}
				renderItem={renderItem}
			/>
		</PageLayout.Content>
	)
}

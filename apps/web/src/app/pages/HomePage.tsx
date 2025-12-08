import { Home } from 'lucide-react'
import { useCallback } from 'react'
import { PageHeader } from '~/app/layouts/PageHeader'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import {
	Empty,
	EmptyContent,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateTopicWithReview } from '~/features/reviews/api/createTopicReview'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicsPageLayout } from '~/features/topics/components/TopicsPageLayout'
import { useTopicsList } from '~/features/topics/hooks/useTopicsList'
import type { Topic } from '~/models/review-topic.types'

export function HomePage() {
	const { openTopicDialog } = useReviewTopicDialog()
	const { createTopicWithReview, isTopicCreatePending: isCreatingTopic } =
		useCreateTopicWithReview()

	// Fetch root topics from API - show non-archived and non-inboxed topics
	const { data: topics = [], isLoading } = useTopics({
		root: true,
		archived: false,
		inboxed: false
	})

	const handleCreateTopic = useCallback(async () => {
		const newTopic = await createTopicWithReview({
			inboxed: false,
			archived: false
		})
		openTopicDialog(newTopic.id)
	}, [createTopicWithReview, openTopicDialog])

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			openTopicDialog(topic.id)
		},
		[openTopicDialog]
	)

	return (
		<TopicsPageLayout>
			<PageHeader icon={Home} title='Topics' />
			<RootTopicsList
				isCreatingTopic={isCreatingTopic}
				isLoading={isLoading}
				onCreateTopic={handleCreateTopic}
				onTopicClick={handleTopicClick}
				topics={topics}
			/>
		</TopicsPageLayout>
	)
}

function RootTopicsList({
	topics,
	onTopicClick,
	onCreateTopic,
	isLoading,
	isCreatingTopic
}: {
	topics: Array<Topic>
	onTopicClick: (topic: Topic) => void
	onCreateTopic: () => void
	isLoading: boolean
	isCreatingTopic: boolean
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
					<EmptyContent>
						<EmptyStateCreateTopicButton
							disabled={isCreatingTopic}
							onClick={onCreateTopic}
							showHoverCard={false}
						/>
					</EmptyContent>
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

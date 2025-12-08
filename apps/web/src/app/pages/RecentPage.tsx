import { useNavigate } from '@tanstack/react-router'
import { History, Home } from 'lucide-react'
import { useCallback } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import { Button } from '~/components/ui/Button'
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
import { useTopicsList } from '~/features/topics/hooks/useTopicsList'
import type { Topic } from '~/models/review-topic.types'

export function RecentPage() {
	const { openTopicDialog } = useReviewTopicDialog()
	const { createTopicWithReview, isTopicCreatePending: isCreatingTopic } =
		useCreateTopicWithReview()

	// Fetch 50 most recent topics
	const { data: topics = [], isLoading } = useTopics({
		order: 'desc',
		limit: 50
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
		<PageLayout>
			<PageLayout.Header icon={History} title='Recent' />
			<RecentList
				isCreatingTopic={isCreatingTopic}
				isLoading={isLoading}
				onCreateTopic={handleCreateTopic}
				onTopicClick={handleTopicClick}
				topics={topics}
			/>
		</PageLayout>
	)
}

function RecentList({
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
	const navigate = useNavigate()
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
							<History />
						</EmptyMedia>
						<EmptyTitle>Your most recent topics will appear here.</EmptyTitle>
					</EmptyHeader>
					<EmptyContent>
						<div className='flex gap-2'>
							<EmptyStateCreateTopicButton
								disabled={isCreatingTopic}
								onClick={onCreateTopic}
							/>
							<Button
								onClick={() => navigate({ to: '/home' })}
								variant='outline'
							>
								<Home />
								Topics
							</Button>
						</div>
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

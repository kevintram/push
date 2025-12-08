import { useNavigate } from '@tanstack/react-router'
import { Archive, Home } from 'lucide-react'
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
import type { Topic } from '~/features/topics/types/topic.types'

export function ArchivedPage() {
	const { openTopicDialog } = useReviewTopicDialog()
	const { createTopicWithReview, isTopicCreatePending: isCreatingTopic } =
		useCreateTopicWithReview()

	// Fetch archived topics sorted by most recently updated
	const { data: topics = [], isLoading } = useTopics({
		archived: true,
		order: 'desc'
	})

	const handleCreateTopic = useCallback(async () => {
		const newTopic = await createTopicWithReview({
			inboxed: false,
			archived: true
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
			<PageLayout.Header icon={Archive} title='Archived' />
			<ArchivedList
				isCreatingTopic={isCreatingTopic}
				isLoading={isLoading}
				onCreateTopic={handleCreateTopic}
				onTopicClick={handleTopicClick}
				topics={topics}
			/>
		</PageLayout>
	)
}

function ArchivedList({
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
							<Archive />
						</EmptyMedia>
						<EmptyTitle>Archived topics will appear here.</EmptyTitle>
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

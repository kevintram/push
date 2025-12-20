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
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useTopics } from '~/features/topics/api/getTopics'
import { useTopicsList } from '~/features/topics/hooks/useTopicsList'
import type { Topic } from '~/features/topics/types/topic.types'

export function RecentPage() {
	const navigate = useNavigate()
	const { mutateAsync: createTopic, isPending: isCreatingTopic } =
		useCreateTopic()

	// Fetch 50 most recent topics
	const { data: topics = [], isLoading } = useTopics({
		order: 'desc',
		limit: 50
	})

	const handleCreateTopic = useCallback(async () => {
		const newTopic = await createTopic({
			inboxed: false,
			archived: false
		})
		navigate({
			to: '/topics/$topicId',
			params: { topicId: newTopic.id.toString() }
		})
	}, [createTopic, navigate])

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
			<PageLayout.Content>
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

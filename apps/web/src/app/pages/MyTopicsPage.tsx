import { useNavigate } from '@tanstack/react-router'
import { Home } from 'lucide-react'
import { useCallback } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
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
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useTopics } from '~/features/topics/api/getTopics'
import { useTopicsList } from '~/features/topics/hooks/useTopicsList'
import type { Topic } from '~/features/topics/types/topic.types'

export function MyTopicsPage() {
	const navigate = useNavigate()
	const { mutateAsync: createTopic, isPending: isCreatingTopic } =
		useCreateTopic()

	// Fetch root topics from API - show non-archived and non-inboxed topics
	const { data: topics = [], isLoading } = useTopics({
		root: true,
		archived: false,
		inboxed: false
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
			<PageLayout.Header icon={Home} title='My topics' />
			<RootTopicsList
				isCreatingTopic={isCreatingTopic}
				isLoading={isLoading}
				onCreateTopic={handleCreateTopic}
				onTopicClick={handleTopicClick}
				topics={topics}
			/>
		</PageLayout>
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
			<PageLayout.Content>
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

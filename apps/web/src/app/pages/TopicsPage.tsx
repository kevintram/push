import { useNavigate } from '@tanstack/react-router'
import { Library, Plus } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { PageLayout } from '~/app/layouts/PageLayout'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicCard } from '~/features/topics/components/TopicCard'
import { TopicNavigatorSheet } from '~/features/topics/components/TopicNavigator'
import {
	CREATE_TOPIC_INTENT_EVENT,
	consumeCreateTopicRequest,
	requestFocusNewTopicTitle
} from '~/features/topics/createTopicIntent'
import {
	DEFAULT_MASONRY_GAP,
	DEFAULT_MASONRY_MIN_ITEM_WIDTH,
	estimateTopicCardSize
} from '~/utils/estimateMasonryItemSize'

export function TopicsPage() {
	const navigate = useNavigate()

	const { data: topics = [], isLoading: topicsLoading } = useTopics({
		root: true,
		order: 'desc'
	})
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()
	const isLoading = topicsLoading

	const handleCreateTopic = useCallback(async () => {
		if (isCreatingTopic) return

		try {
			const created = await createTopicAsync({
				title: '',
				body: '',
				parent_id: null
			})
			requestFocusNewTopicTitle(created.id)
			await navigate({
				to: '/topics/$topicId',
				params: { topicId: created.id.toString() }
			})
		} catch {
			toast.error('Failed to create topic')
		}
	}, [createTopicAsync, isCreatingTopic, navigate])

	useEffect(() => {
		const createRequestedTopic = async () => {
			if (consumeCreateTopicRequest()) {
				await handleCreateTopic()
			}
		}

		createRequestedTopic().catch(() => {})
		window.addEventListener(CREATE_TOPIC_INTENT_EVENT, createRequestedTopic)

		return () => {
			window.removeEventListener(
				CREATE_TOPIC_INTENT_EVENT,
				createRequestedTopic
			)
		}
	}, [handleCreateTopic])

	let content = <LoadingSpinner containerClassName='min-h-64' />

	if (!isLoading && topics.length === 0) {
		content = (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<Library />
					</EmptyMedia>
					<EmptyTitle>No topics yet</EmptyTitle>
					<EmptyDescription>Create topics to get started</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button disabled={isCreatingTopic} onClick={handleCreateTopic}>
						<Plus />
						Create
					</Button>
				</EmptyContent>
			</Empty>
		)
	}

	if (!isLoading && topics.length > 0) {
		content = (
			<MasonryLayout
				estimateItemSize={(topic, _index, laneWidth) =>
					estimateTopicCardSize(topic, laneWidth)
				}
				gap={DEFAULT_MASONRY_GAP}
				getItemKey={topic => `topic-${topic.id}`}
				items={topics}
				minItemWidth={DEFAULT_MASONRY_MIN_ITEM_WIDTH}
				renderItem={topic => (
					<TopicCard
						onClick={() =>
							navigate({
								to: '/topics/$topicId',
								params: { topicId: topic.id.toString() }
							})
						}
						topic={topic}
					/>
				)}
			/>
		)
	}

	return (
		<div className='flex h-full min-h-0 w-full'>
			<div className='min-w-0 flex-1'>
				<PageLayout>
					<PageLayout.Header
						actions={
							<div className='flex items-center gap-2'>
								<TopicNavigatorSheet />
								<Button disabled={isCreatingTopic} onClick={handleCreateTopic}>
									<Plus />
									Create
								</Button>
							</div>
						}
						icon={Library}
						title='Topics'
					/>
					<PageLayout.Content className='max-w-screen space-y-6 p-6'>
						{content}
					</PageLayout.Content>
				</PageLayout>
			</div>
		</div>
	)
}

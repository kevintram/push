import { useNavigate } from '@tanstack/react-router'
import { Home, Inbox } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import { Button } from '~/components/ui/Button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useCreateTopicWithReview } from '~/features/reviews/api/createTopicReview'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'

const MIN_CARD_WIDTH = 280
const MIN_CARD_HEIGHT = 168
const CHARS_PER_LINE = 36
const LINE_HEIGHT = 18
const BASE_HEIGHT = 140

export function InboxPage() {
	const navigate = useNavigate()
	const { data: inboxTopics, isLoading } = useTopics({
		inboxed: true,
		archived: false
	})
	const { createTopicWithReview, isTopicCreatePending: isCreatingTopic } =
		useCreateTopicWithReview()

	const handleTopicSelect = useCallback(
		(topic: Topic) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: topic.id.toString() }
			})
		},
		[navigate]
	)

	const handleCreateInboxTopic = useCallback(async () => {
		const newTopic = await createTopicWithReview({
			inboxed: true,
			archived: false
		})
		navigate({
			to: '/topics/$topicId',
			params: { topicId: newTopic.id.toString() }
		})
	}, [createTopicWithReview, navigate])

	const inboxCountLabel = isLoading ? '...' : (inboxTopics?.length ?? 0)

	return (
		<PageLayout>
			<PageLayout.Header icon={Inbox} title='Inbox'>
				<span className='font-semibold text-muted-foreground text-xl'>
					({inboxCountLabel})
				</span>
			</PageLayout.Header>

			<InboxList
				isCreatingTopic={isCreatingTopic}
				isLoading={isLoading}
				onCreateInboxTopic={handleCreateInboxTopic}
				onTopicSelect={handleTopicSelect}
				topics={inboxTopics}
			/>
		</PageLayout>
	)
}

function InboxList({
	topics,
	onTopicSelect,
	onCreateInboxTopic,
	isLoading,
	isCreatingTopic
}: {
	topics: Array<Topic> | undefined | null
	onTopicSelect: (topic: Topic) => void
	onCreateInboxTopic: () => void
	isLoading: boolean
	isCreatingTopic: boolean
}) {
	const navigate = useNavigate()
	const topicList = useMemo<Array<Topic>>(() => topics ?? [], [topics])

	const estimateItemSize = useCallback((topic: Topic) => {
		const nameLength = topic.name?.length ?? 0
		const notesLength = topic.notes?.length ?? 0

		const nameLines = Math.max(1, Math.ceil(nameLength / CHARS_PER_LINE))
		const notesLines =
			notesLength > 0 ? Math.ceil(notesLength / CHARS_PER_LINE) : 0

		const height =
			BASE_HEIGHT + (nameLines - 1) * LINE_HEIGHT + notesLines * LINE_HEIGHT

		return Math.max(height, MIN_CARD_HEIGHT)
	}, [])

	const renderItem = useCallback(
		(topic: Topic) => <TopicCard onTopicClick={onTopicSelect} topic={topic} />,
		[onTopicSelect]
	)

	const getItemKey = useCallback((topic: Topic) => topic.id, [])

	if (isLoading) {
		return <MasonryLayoutSkeleton />
	}

	if (topicList.length === 0) {
		return (
			<div className='p-4'>
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
					<EmptyContent>
						<div className='flex gap-2'>
							<EmptyStateCreateTopicButton
								buttonText='Add a topic to your inbox'
								disabled={isCreatingTopic}
								onClick={onCreateInboxTopic}
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
				items={topicList}
				minItemWidth={MIN_CARD_WIDTH}
				overscan={6}
				renderItem={renderItem}
			/>
		</div>
	)
}

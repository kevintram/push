import { createFileRoute } from '@tanstack/react-router'
import { Inbox } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { PageHeader } from '~/components/PageHeader'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { TopicCard } from '~/features/topics/components/TopicCard'
import { TopicsPageLayout } from '~/features/topics/components/TopicsPageLayout'
import { TopicsPageSkeleton } from '~/features/topics/components/TopicsPageSkeleton'
import { useInboxTopics } from '~/features/topics/hooks'
import type { Topic } from '~/models/review-topic.types'

const MIN_CARD_WIDTH = 280
const MIN_CARD_HEIGHT = 168
const CHARS_PER_LINE = 36
const LINE_HEIGHT = 18
const BASE_HEIGHT = 140

export const Route = createFileRoute('/inbox')({
	component: RouteComponent
})

function RouteComponent() {
	const { data: inboxTopics, isLoading } = useInboxTopics()
	const { openTopicDialog } = useReviewTopicDialog()

	const handleTopicSelect = useCallback(
		(topic: Topic) => {
			openTopicDialog(topic.id)
		},
		[openTopicDialog]
	)

	const inboxCountLabel = isLoading ? '...' : (inboxTopics?.length ?? 0)

	return (
		<TopicsPageLayout>
			<PageHeader icon={Inbox} title='Inbox'>
				<span className='font-semibold text-muted-foreground text-xl'>
					({inboxCountLabel})
				</span>
			</PageHeader>

			<InboxList
				isLoading={isLoading}
				onTopicSelect={handleTopicSelect}
				topics={inboxTopics}
			/>
		</TopicsPageLayout>
	)
}

function InboxList({
	topics,
	onTopicSelect,
	isLoading
}: {
	topics: Array<Topic> | undefined | null
	onTopicSelect: (topic: Topic) => void
	isLoading: boolean
}) {
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
		(topic: Topic) => (
			<TopicCard
				onTopicClick={onTopicSelect}
				reviews={topic.reviews ?? []}
				topic={topic}
			/>
		),
		[onTopicSelect]
	)

	const getItemKey = useCallback((topic: Topic) => topic.id, [])

	if (isLoading) {
		return <TopicsPageSkeleton />
	}

	if (topicList.length === 0) {
		return (
			<div className='flex flex-1 items-center justify-center py-12'>
				<div className='text-center text-muted-foreground'>
					<p className='font-medium text-lg'>Your inbox is empty</p>
					<p className='text-sm'>Create your first quick entry topic above</p>
				</div>
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

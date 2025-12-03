import { History, Plus } from 'lucide-react'
import { useCallback } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { PageHeader } from '~/components/PageHeader'
import { Button } from '~/components/ui/Button'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useRecentTopics } from '~/features/topics/hooks'
import { useCreateTopicWithReview } from '~/features/topics/hooks/useCreateTopicWithReview'
import type { Topic } from '~/models/review-topic.types'
import { RootTopicsPageSkeleton } from '../RootTopicsPage/RootTopicsPageSkeleton'
import { TopicsPageLayout } from '../RootTopicsPage/TopicsPageLayout'
import { TopicCard } from '../TopicCard'

const MIN_CARD_WIDTH = 280
const MIN_HEIGHT = 96

export function RecentTopicsPage() {
	const { openTopicDialog } = useReviewTopicDialog()
	const { createTopicWithReview } = useCreateTopicWithReview()

	// Fetch 50 most recent topics
	const { data: topics = [], isLoading } = useRecentTopics()

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

	const estimateItemSize = useCallback((topic: Topic) => {
		const baseHeight = 80
		const lineHeight = 10
		const numCharsPerLine = 30
		const newLine = 10

		const nameHeight =
			Math.floor(topic.name.length / numCharsPerLine) * lineHeight
		const notesHeight =
			Math.floor(topic.notes.length / numCharsPerLine) * lineHeight

		const calculatedHeight = baseHeight + nameHeight + newLine + notesHeight

		return Math.max(calculatedHeight, MIN_HEIGHT)
	}, [])

	const renderItem = useCallback(
		(topic: Topic) => (
			<TopicCard
				minHeight={MIN_HEIGHT}
				onTopicClick={handleTopicClick}
				reviews={topic.reviews ?? []}
				topic={topic}
			/>
		),
		[handleTopicClick]
	)

	const getItemKey = useCallback((topic: Topic) => topic.id, [])

	return (
		<TopicsPageLayout>
			<PageHeader icon={History} title='Recent' />

			{isLoading && <RootTopicsPageSkeleton />}

			{!isLoading && topics.length === 0 && (
				<div className='px-6 pt-2'>
					<div className='text-center'>
						<History className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
						<p className='mb-2 text-muted-foreground'>No topics yet</p>
						<Button onClick={handleCreateTopic} variant='outline'>
							<Plus className='mr-2 h-4 w-4' />
							Create your first topic
						</Button>
					</div>
				</div>
			)}

			{!isLoading && topics.length > 0 && (
				<div className='p-6'>
					<MasonryLayout
						estimateItemSize={estimateItemSize}
						gap={16}
						getItemKey={getItemKey}
						items={topics}
						minItemWidth={MIN_CARD_WIDTH}
						renderItem={renderItem}
					/>
				</div>
			)}
		</TopicsPageLayout>
	)
}

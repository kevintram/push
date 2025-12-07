import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { History, Plus } from 'lucide-react'
import { useCallback } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import { PageHeader } from '~/components/PageHeader'
import { Button } from '~/components/ui/Button'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { getTopics } from '~/features/topics/api'
import { TopicsPageLayout } from '~/features/topics/components/TopicsPageLayout'
import { useCreateTopicWithReview } from '~/features/topics/hooks/useCreateTopicWithReview'
import { useTopicsList } from '~/features/topics/hooks/useTopicsList'
import type { Topic } from '~/models/review-topic.types'

export const Route = createFileRoute('/recent')({
	component: RouteComponent
})

function RouteComponent() {
	const { openTopicDialog } = useReviewTopicDialog()
	const { createTopicWithReview } = useCreateTopicWithReview()

	// Fetch 50 most recent topics
	const { data: topics = [], isLoading } = useQuery({
		queryKey: ['topics', 'recent'],
		queryFn: () => getTopics({ order: 'desc', limit: 50 })
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
			<PageHeader icon={History} title='Recent' />
			<RecentList
				isLoading={isLoading}
				onCreateTopic={handleCreateTopic}
				onTopicClick={handleTopicClick}
				topics={topics}
			/>
		</TopicsPageLayout>
	)
}

function RecentList({
	topics,
	onTopicClick,
	onCreateTopic,
	isLoading
}: {
	topics: Array<Topic>
	onTopicClick: (topic: Topic) => void
	onCreateTopic: () => void
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
			<div className='px-6 pt-2'>
				<div className='text-center'>
					<History className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
					<p className='mb-2 text-muted-foreground'>No topics yet</p>
					<Button onClick={onCreateTopic} variant='outline'>
						<Plus className='mr-2 h-4 w-4' />
						Create your first topic
					</Button>
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
				items={topics}
				minItemWidth={280}
				renderItem={renderItem}
			/>
		</div>
	)
}

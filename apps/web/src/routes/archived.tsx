import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Archive, Plus } from 'lucide-react'
import { useCallback } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import { PageHeader } from '~/components/PageHeader'
import { Button } from '~/components/ui/Button'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateTopicWithReview } from '~/features/reviews/api/createTopicReview'
import { getTopics } from '~/features/topics/api/getTopics'
import { TopicsPageLayout } from '~/features/topics/components/TopicsPageLayout'
import { useTopicsList } from '~/features/topics/hooks/useTopicsList'
import type { Topic } from '~/models/review-topic.types'

export const Route = createFileRoute('/archived')({
	component: RouteComponent
})

function RouteComponent() {
	const { openTopicDialog } = useReviewTopicDialog()
	const { createTopicWithReview } = useCreateTopicWithReview()

	// Fetch archived topics sorted by most recently updated
	const { data: topics = [], isLoading } = useQuery({
		queryKey: ['topics', 'archived'],
		queryFn: () => getTopics({ archived: true, order: 'desc' })
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
		<TopicsPageLayout>
			<PageHeader icon={Archive} title='Archived' />
			<ArchivedList
				isLoading={isLoading}
				onCreateTopic={handleCreateTopic}
				onTopicClick={handleTopicClick}
				topics={topics}
			/>
		</TopicsPageLayout>
	)
}

function ArchivedList({
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
					<Archive className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
					<p className='mb-2 text-muted-foreground'>No archived topics yet</p>
					<Button onClick={onCreateTopic} variant='outline'>
						<Plus className='mr-2 h-4 w-4' />
						Create archived topic
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

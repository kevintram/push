import { useNavigate } from '@tanstack/react-router'
import { Library } from 'lucide-react'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicCard } from '~/features/topics/components/TopicCard'

export function MyLibraryPage() {
	const navigate = useNavigate()

	const { data: topics = [], isLoading: topicsLoading } = useTopics({
		root: true,
		order: 'desc'
	})
	const isLoading = topicsLoading

	if (isLoading) {
		return (
			<PageLayout>
				<PageLayout.Header icon={Library} title='My Library' />
				<PageLayout.Content className='max-w-screen p-6'>
					<LoadingSpinner containerClassName='min-h-64' />
				</PageLayout.Content>
			</PageLayout>
		)
	}

	if (topics.length === 0) {
		return (
			<PageLayout>
				<PageLayout.Header icon={Library} title='My Library' />
				<PageLayout.Content>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<Library />
							</EmptyMedia>
							<EmptyTitle>Your library is empty</EmptyTitle>
							<EmptyDescription>Create topics to get started</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</PageLayout.Content>
			</PageLayout>
		)
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={Library} title='My Library' />
			<PageLayout.Content className='max-w-screen p-6'>
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{topics.map(topic => (
						<TopicCard
							key={`topic-${topic.id}`}
							onClick={() =>
								navigate({
									to: '/topics/$topicId',
									params: { topicId: topic.id.toString() }
								})
							}
							topic={topic}
						/>
					))}
				</div>
			</PageLayout.Content>
		</PageLayout>
	)
}

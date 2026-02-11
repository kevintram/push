import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useCallback } from 'react'
import { LoadingOrError } from '~/components/LoadingOrError'
import { Button } from '~/components/ui/button'
import { useTopicWithRelationships } from '~/features/topics/api/getTopic'
import { TopicDetailNavBar } from '~/features/topics/components/TopicDetail/TopicDetailNavBar'
import { EntityReviewsPageContent } from './EntityReviewsPageContent'

interface TopicReviewsPageProps {
	topicId: string
}

export function TopicReviewsPage({ topicId }: TopicReviewsPageProps) {
	const navigate = useNavigate()
	const router = useRouter()
	const parsedTopicId = Number.parseInt(topicId, 10)
	const { topic, isLoading } = useTopicWithRelationships(parsedTopicId)

	const handleTopicNavigate = useCallback(
		(nextTopicId: number) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: nextTopicId.toString() }
			})
		},
		[navigate]
	)

	if (isLoading) {
		return <LoadingOrError />
	}

	if (!topic) {
		return <LoadingOrError error={new Error('Topic not found')} />
	}

	return (
		<EntityReviewsPageContent
			entityId={topic.id}
			entityType='topic'
			navbar={
				<TopicDetailNavBar
					activeTab='reviews'
					headerBeforeActions={
						<Button
							className='h-6 w-6 p-0'
							onClick={() => router.history.back()}
							size='sm'
							title='Go back'
							variant='ghost'
						>
							<ArrowLeft className='h-4 w-4' />
						</Button>
					}
					onParentSelect={handleTopicNavigate}
					topic={topic}
				/>
			}
		/>
	)
}

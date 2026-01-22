import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { SidebarTrigger } from '~/components/ui/Sidebar'
import { useTopicWithRelationships } from '~/features/topics/api/getTopic'
import { TopicDetail } from '~/features/topics/components/TopicDetail/TopicDetail'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'

interface TopicDetailPageProps {
	topicId: string
}

function BrowserNavigationButtons() {
	const router = useRouter()

	return (
		<Button
			className='h-6 w-6 p-0'
			onClick={() => router.history.back()}
			size='sm'
			title='Go back'
			variant='ghost'
		>
			<ArrowLeft className='h-4 w-4' />
		</Button>
	)
}

export function TopicDetailPage({ topicId }: TopicDetailPageProps) {
	const navigate = useNavigate()
	const router = useRouter()

	const { topic, isLoading } = useTopicWithRelationships(
		Number.parseInt(topicId, 10)
	)

	const handleDelete = useCallback(() => {
		router.history.back()
	}, [router])

	const handleTopicNavigate = useCallback(
		(topicId: number) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: topicId.toString() }
			})
		},
		[navigate]
	)

	const handleSourceNavigate = useCallback(
		(sourceId: number) => {
			navigate({
				to: '/sources/$sourceId',
				params: { sourceId: sourceId.toString() }
			})
		},
		[navigate]
	)

	const contextValue = useMemo(
		() => ({
			topic,
			isLoading
		}),
		[topic, isLoading]
	)

	return (
		<TopicContext value={contextValue}>
			<TopicDetail
				className='mx-auto max-w-5xl'
				headerAfterActions={<SidebarTrigger />}
				headerBeforeActions={<BrowserNavigationButtons />}
				onDelete={handleDelete}
				onSourceNavigate={handleSourceNavigate}
				onTopicNavigate={handleTopicNavigate}
			/>
		</TopicContext>
	)
}

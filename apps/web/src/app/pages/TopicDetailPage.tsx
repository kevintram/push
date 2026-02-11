import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/button'
import { useTopicWithRelationships } from '~/features/topics/api/getTopic'
import {
	TopicDetail,
	type TopicDetailTab
} from '~/features/topics/components/TopicDetail/TopicDetail'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import { useConversionNavigate } from '~/hooks/useConversionNavigate'

interface TopicDetailPageProps {
	topicId: string
	activeTab?: TopicDetailTab
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

export function TopicDetailPage({
	topicId,
	activeTab = 'children'
}: TopicDetailPageProps) {
	const navigate = useNavigate()
	const router = useRouter()
	const handleConvertSuccess = useConversionNavigate()

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

	const handlePracticeNavigate = useCallback(
		(practiceId: number) => {
			navigate({
				to: '/practices/$practiceId',
				params: { practiceId: practiceId.toString() }
			})
		},
		[navigate]
	)

	const handleTabChange = useCallback(
		(nextTab: TopicDetailTab) => {
			if (nextTab === activeTab) return
			if (nextTab === 'children') {
				navigate({
					replace: true,
					to: '/topics/$topicId',
					params: { topicId }
				})
				return
			}
			if (nextTab === 'practice') {
				navigate({
					replace: true,
					to: '/topics/$topicId/practice',
					params: { topicId }
				})
				return
			}
			if (nextTab === 'sources') {
				navigate({
					replace: true,
					to: '/topics/$topicId/sources',
					params: { topicId }
				})
				return
			}
			navigate({
				replace: true,
				to: '/topics/$topicId/related',
				params: { topicId }
			})
		},
		[activeTab, navigate, topicId]
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
				activeTab={activeTab}
				className='mx-auto max-w-5xl'
				headerBeforeActions={<BrowserNavigationButtons />}
				onConvertSuccess={handleConvertSuccess}
				onDelete={handleDelete}
				onPracticeNavigate={handlePracticeNavigate}
				onSourceNavigate={handleSourceNavigate}
				onTabChange={handleTabChange}
				onTopicNavigate={handleTopicNavigate}
			/>
		</TopicContext>
	)
}

import { useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import { SidebarTrigger } from '~/components/ui/Sidebar'
import { useTopicWithRelationships } from '../../hooks/useTopicWithRelationships'
import { TopicContext } from '../../stores/SelectedTopicContext'
import { TopicDetail } from '../TopicDetail/TopicDetail'

export function TopicPage({ topicId }: { topicId: number | undefined }) {
	const navigate = useNavigate()
	const { topic, isLoading } = useTopicWithRelationships(topicId)

	const handleDelete = useCallback(() => {
		navigate({
			to: '/topics/{-$topicId}',
			params: { topicId: undefined }
		})
	}, [navigate])

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
				afterMoreButton={<SidebarTrigger />}
				onDelete={handleDelete}
			/>
		</TopicContext>
	)
}

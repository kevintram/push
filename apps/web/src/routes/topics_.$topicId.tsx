import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import { SidebarTrigger } from '~/components/ui/Sidebar'
import { useTopicWithRelationships } from '~/features/topics/api/getTopic'
import { TopicDetail } from '~/features/topics/components/TopicDetail/TopicDetail'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'

export const Route = createFileRoute('/topics_/$topicId')({
	component: RouteComponent
})

function RouteComponent() {
	const { topicId } = Route.useParams()
	const navigate = useNavigate()
	const { topic, isLoading } = useTopicWithRelationships(
		Number.parseInt(topicId, 10)
	)

	const handleDelete = useCallback(() => {
		navigate({
			to: '/home'
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
				headerAfterActions={<SidebarTrigger />}
				onDelete={handleDelete}
			/>
		</TopicContext>
	)
}

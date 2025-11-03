import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { SidebarTrigger } from '~/components/ui/Sidebar'
import type { Topic } from '~/models/todo-topic.types'
import { useTopicDialog } from '../../stores/TopicDialogContext'
import { TopicDetail } from '../TopicDetail/TopicDetail'

export function TopicPage({ topicId }: { topicId: number | undefined }) {
	const navigate = useNavigate()
	const { openTopicDialog } = useTopicDialog()

	const handleDelete = useCallback(() => {
		navigate({
			to: '/topics/{-$topicId}',
			params: { topicId: undefined }
		})
	}, [navigate])

	const handleTopicDialogOpen = useCallback(
		(topic: Topic) => {
			openTopicDialog(topic.id)
		},
		[openTopicDialog]
	)

	return (
		<TopicDetail
			headerActions={<SidebarTrigger />}
			onDelete={handleDelete}
			onTopicChange={handleTopicDialogOpen}
			topicId={topicId}
		/>
	)
}

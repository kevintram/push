import { useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { SidebarTrigger } from '~/components/ui/Sidebar'
import type { Topic } from '~/types/topics.types'
import { TopicContext } from '../../stores/SelectedTopicContext'
import { TopicDetail } from '../TopicDetail/TopicDetail'
import { TopicDialog } from '../TopicDialog'

export function TopicPage({ topicId }: { topicId: number | undefined }) {
	const navigate = useNavigate()
	const [dialogTopic, setDialogTopic] = useState<Topic | null>(null)
	const [showDialog, setShowDialog] = useState(false)

	const handleDelete = useCallback(() => {
		navigate({
			to: '/topics/{-$topicId}',
			params: { topicId: undefined }
		})
	}, [navigate])

	const handleTopicDialogOpen = useCallback((topic: Topic) => {
		setDialogTopic(topic)
		setShowDialog(true)
	}, [])

	const dialogContextValue = useMemo(
		() => ({
			topic: dialogTopic ?? undefined,
			onTopicChange: handleTopicDialogOpen
		}),
		[dialogTopic, handleTopicDialogOpen]
	)

	return (
		<>
			<TopicDetail
				headerActions={<SidebarTrigger />}
				onDelete={handleDelete}
				onTopicChange={handleTopicDialogOpen}
				topicId={topicId}
			/>

			<TopicContext value={dialogContextValue}>
				<TopicDialog onOpenChange={setShowDialog} open={showDialog} />
			</TopicContext>
		</>
	)
}

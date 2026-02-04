import { useCallback, useMemo, useState } from 'react'
import { TopicDialog } from '~/features/topics/components/TopicDialog'
import { TopicDialogContext } from '../stores/TopicDialogContext'

export function TopicDialogProvider({
	children
}: {
	children: React.ReactNode
}) {
	const [topicDialog, setTopicDialog] = useState<{
		isOpen: boolean
		topicId: number | undefined
	}>({ isOpen: false, topicId: undefined })

	const openTopicDialog = useCallback((topicId: number) => {
		setTopicDialog({ isOpen: true, topicId })
	}, [])

	const closeTopicDialog = useCallback(() => {
		setTopicDialog({ isOpen: false, topicId: undefined })
	}, [])

	const maximizeTopicDialog = useCallback(() => {
		setTopicDialog({ isOpen: false, topicId: undefined })
	}, [])

	const contextValue = useMemo(
		() => ({
			topicDialogState: topicDialog,
			openTopicDialog,
			closeTopicDialog,
			maximizeTopicDialog
		}),
		[topicDialog, openTopicDialog, closeTopicDialog, maximizeTopicDialog]
	)

	return (
		<TopicDialogContext value={contextValue}>
			{children}
			<TopicDialog />
		</TopicDialogContext>
	)
}

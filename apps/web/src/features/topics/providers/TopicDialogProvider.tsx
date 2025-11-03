import { useCallback, useMemo, useState } from 'react'
import { TopicDialog } from '../components/TopicDialog'
import { TopicDialogContext } from '../stores/TopicDialogContext'

export function TopicDialogProvider({
	children
}: {
	children: React.ReactNode
}) {
	const [isOpen, setIsOpen] = useState(false)
	const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>()

	const openTopicDialog = useCallback((topicId: number) => {
		setIsOpen(true)
		setSelectedTopicId(topicId)
	}, [])

	const closeTopicDialog = useCallback(() => {
		setIsOpen(false)
		setSelectedTopicId(undefined)
	}, [])

	const contextValue = useMemo(
		() => ({ openTopicDialog, closeTopicDialog }),
		[openTopicDialog, closeTopicDialog]
	)

	return (
		<TopicDialogContext value={contextValue}>
			{children}
			<TopicDialog
				onOpenChange={setIsOpen}
				open={isOpen}
				topicId={selectedTopicId}
			/>
		</TopicDialogContext>
	)
}

import { useCallback, useMemo, useState } from 'react'
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
		() => ({ isOpen, selectedTopicId, openTopicDialog, closeTopicDialog }),
		[isOpen, selectedTopicId, openTopicDialog, closeTopicDialog]
	)

	return (
		<TopicDialogContext value={contextValue}>{children}</TopicDialogContext>
	)
}

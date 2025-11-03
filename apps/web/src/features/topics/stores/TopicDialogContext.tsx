import { createContext, use, useCallback, useMemo, useState } from 'react'
import { TopicDialog } from '../components/TopicDialog'
import { useTopicWithRelationships } from '../hooks/useTopicWithRelationships'
import { TopicContext } from './SelectedTopicContext'

interface TopicDialogContextValue {
	openTopicDialog: (topicId: number) => void
	closeTopicDialog: () => void
}

const TopicDialogContext = createContext<TopicDialogContextValue | null>(null)

export function TopicDialogProvider({
	children
}: {
	children: React.ReactNode
}) {
	const [isOpen, setIsOpen] = useState(false)
	const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>()

	// Fetch the full topic with relationships
	const { topic } = useTopicWithRelationships(selectedTopicId)

	const openTopicDialog = useCallback((topicId: number) => {
		setSelectedTopicId(topicId)
		setIsOpen(true)
	}, [])

	const closeTopicDialog = useCallback(() => {
		setIsOpen(false)
	}, [])

	const contextValue = useMemo(
		() => ({ openTopicDialog, closeTopicDialog }),
		[openTopicDialog, closeTopicDialog]
	)

	const topicContextValue = useMemo(
		() => ({
			topic,
			onTopicChange: (topic: { id: number }) => openTopicDialog(topic.id)
		}),
		[topic, openTopicDialog]
	)

	return (
		<TopicDialogContext value={contextValue}>
			{children}
			<TopicContext value={topicContextValue}>
				<TopicDialog onOpenChange={setIsOpen} open={isOpen} />
			</TopicContext>
		</TopicDialogContext>
	)
}

export function useTopicDialog() {
	const context = use(TopicDialogContext)
	if (!context) {
		throw new Error('useTopicDialog must be used within TopicDialogProvider')
	}
	return context
}

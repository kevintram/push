import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { TopicActionMenu } from '../components/TopicActionMenu'
import { TopicCard } from '../components/TopicCard'
import type { Topic } from '../types/topic.types'

export function useTopicsList({
	minHeight = 96,
	onTopicClick
}: {
	minHeight?: number
	onTopicClick: (topic: Topic) => void
}) {
	const estimateItemSize = useCallback(
		(topic: Topic, _index: number): number => {
			const baseHeight = 80
			const lineHeight = 10
			const numCharsPerLine = 30
			const newLine = 10

			const nameHeight =
				Math.floor(topic.name.length / numCharsPerLine) * lineHeight
			const notesHeight =
				Math.floor(topic.notes.length / numCharsPerLine) * lineHeight

			const calculatedHeight = baseHeight + nameHeight + newLine + notesHeight

			return Math.max(calculatedHeight, minHeight)
		},
		[minHeight]
	)

	const renderItem = useCallback(
		(topic: Topic, _index: number): ReactNode => {
			return (
				<TopicCard
					headerRight={<TopicActionMenu topic={topic} />}
					minHeight={minHeight}
					onTopicClick={onTopicClick}
					topic={topic}
				/>
			)
		},
		[minHeight, onTopicClick]
	)

	const getItemKey = useCallback(
		(topic: Topic, _index: number): string | number => topic.id,
		[]
	)

	return { estimateItemSize, renderItem, getItemKey }
}

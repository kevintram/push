import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { estimateCardSize } from '~/components/EntityCard'
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
		(topic: Topic, _index: number, laneWidth: number): number =>
			estimateCardSize(topic.name, topic.notes, laneWidth),
		[]
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

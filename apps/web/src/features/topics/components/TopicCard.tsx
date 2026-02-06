import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
	LearnableCardBase,
	type LearnableCardConfig
} from '~/components/LearnableCard'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import { useTopicMetrics } from '~/features/topics/hooks/useTopicMetrics'
import type { Topic } from '~/features/topics/types/topic.types'
import { prefetchTopicRelations } from '~/features/topics/utils/prefetchTopicRelations'

const MIN_HEIGHT = 96

interface TopicCardProps {
	topic: Topic
	onTopicClick?: (topic: Topic) => void
	minHeight?: number
	searchQuery?: string
	headerRight?: React.ReactNode
	/** Whether to show the "leaving soon" badge in the header. Defaults to false. */
	showLeavingSoon?: boolean
}

export function TopicCard({
	topic,
	onTopicClick,
	minHeight = MIN_HEIGHT,
	searchQuery,
	headerRight,
	showLeavingSoon = false
}: TopicCardProps) {
	const queryClient = useQueryClient()
	const { mutate: updateTopic, isPending: isUpdatingTopic } = useUpdateTopic()
	const metrics = useTopicMetrics(topic)

	const config = useMemo(
		(): LearnableCardConfig<Topic> => ({
			entityType: 'topic',
			getPrimaryText: t => t.name,
			getSecondaryText: t => t.notes,
			showTypeBadge: false,
			getRelationsCount: t => t.children_count ?? 0,
			getRelationsLabel: count =>
				count === 1 ? '1 child' : `${count} children`,
			onSrsToggle: (id, newValue) => updateTopic({ id, srs_enabled: newValue }),
			isUpdating: isUpdatingTopic,
			onPrefetch: (qc, t) => prefetchTopicRelations(qc, t)
		}),
		[updateTopic, isUpdatingTopic]
	)

	return (
		<LearnableCardBase
			config={config}
			entity={topic}
			headerRight={headerRight}
			metrics={metrics}
			minHeight={minHeight}
			onEntityClick={onTopicClick}
			queryClient={queryClient}
			searchQuery={searchQuery}
			showLeavingSoon={showLeavingSoon}
		/>
	)
}

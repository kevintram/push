import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
	LearnableCardBase,
	type LearnableCardConfig
} from '~/components/LearnableCard'
import type { BucketInfo } from '~/hooks/useLearnableMetrics'
import { sourceKeys } from '../api/queryKeys'
import { useUpdateSource } from '../api/updateSource'
import { useSourceMetrics } from '../hooks/useSourceMetrics'
import type { Source } from '../types/source.types'

const MIN_HEIGHT = 96

interface SourceCardProps {
	source: Source
	onSourceClick?: (source: Source) => void
	minHeight?: number
	searchQuery?: string
	headerRight?: React.ReactNode
	/** Whether to show the "leaving soon" badge in the header. Defaults to false. */
	showLeavingSoon?: boolean
}

export function SourceCard({
	source,
	onSourceClick,
	minHeight = MIN_HEIGHT,
	searchQuery,
	headerRight,
	showLeavingSoon = false
}: SourceCardProps) {
	const queryClient = useQueryClient()
	const { mutate: updateSource, isPending: isUpdatingSource } =
		useUpdateSource()
	const metrics = useSourceMetrics(source)

	const config = useMemo(
		(): LearnableCardConfig<Source> => ({
			getPrimaryText: s => s.title,
			showTypeBadge: true,
			typeBadgeLabel: 'Source',
			getChildrenLabel: count =>
				count === 1 ? '1 child source' : `${count} child sources`,
			onSrsToggle: (id, newValue) =>
				updateSource({ id, srs_enabled: newValue }),
			isUpdating: isUpdatingSource,
			onPrefetch: (qc, s) => {
				qc.prefetchQuery({
					queryKey: sourceKeys.detail(s.id),
					staleTime: 30_000
				})
			},
			getLeavingSoonTooltip: (
				daysUntil: number,
				bucketLabel: BucketInfo['label']
			) =>
				daysUntil === 1
					? `1 day until ${bucketLabel === 'Early' ? 'ready' : 'late'}`
					: `${daysUntil} days until ${bucketLabel === 'Early' ? 'ready' : 'late'}`
		}),
		[updateSource, isUpdatingSource]
	)

	return (
		<LearnableCardBase
			config={config}
			entity={source}
			headerRight={headerRight}
			metrics={metrics}
			minHeight={minHeight}
			onEntityClick={onSourceClick}
			queryClient={queryClient}
			searchQuery={searchQuery}
			showLeavingSoon={showLeavingSoon}
		/>
	)
}

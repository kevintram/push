import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
	LearnableCardBase,
	type LearnableCardConfig
} from '~/components/LearnableCard'
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
			entityType: 'source',
			getPrimaryText: s => s.title,
			getSecondaryText: s => s.notes,
			showTypeBadge: true,
			typeBadgeLabel: 'Source',
			getParentLabel: s => s.parent?.title || s.parent?.notes || null,
			getRelationsCount: s => s.children_count ?? 0,
			getRelationsLabel: count =>
				count === 1 ? '1 child source' : `${count} child sources`,
			onSrsToggle: (id, newValue) =>
				updateSource({ id, srs_enabled: newValue }),
			isUpdating: isUpdatingSource,
			onPrefetch: (qc, s) => {
				qc.prefetchQuery({
					queryKey: sourceKeys.detail(s.id),
					staleTime: 30_000
				})
			}
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

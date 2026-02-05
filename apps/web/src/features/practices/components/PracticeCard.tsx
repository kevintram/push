import { useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import {
	LearnableCardBase,
	type LearnableCardConfig
} from '~/components/LearnableCard'
import { useLearnableMetrics } from '~/hooks/useLearnableMetrics'
import { practiceKeys } from '../api/queryKeys'
import { useUpdatePractice } from '../api/updatePractice'
import type { Practice } from '../types/practice.types'

const MIN_HEIGHT = 96

interface PracticeCardProps {
	practice: Practice
	onPracticeClick?: (practice: Practice) => void
	minHeight?: number
	searchQuery?: string
	headerRight?: ReactNode
	/** Whether to show the "leaving soon" badge in the header. Defaults to false. */
	showLeavingSoon?: boolean
}

export function PracticeCard({
	practice,
	onPracticeClick,
	minHeight = MIN_HEIGHT,
	searchQuery,
	headerRight,
	showLeavingSoon = false
}: PracticeCardProps) {
	const queryClient = useQueryClient()
	const { mutate: updatePractice, isPending: isUpdatingPractice } =
		useUpdatePractice()
	const metrics = useLearnableMetrics(practice)

	const config = useMemo(
		(): LearnableCardConfig<Practice> => ({
			getPrimaryText: p => p.prompt,
			getSecondaryText: p => p.answer,
			showTypeBadge: true,
			typeBadgeLabel: 'Practice',
			getRelationsCount: p => (p.topics_count ?? 0) + (p.sources_count ?? 0),
			getRelationsLabel: count =>
				count === 1 ? '1 relation' : `${count} relations`,
			onSrsToggle: (id, newValue) =>
				updatePractice({ id, srs_enabled: newValue }),
			isUpdating: isUpdatingPractice,
			onPrefetch: (qc, p) => {
				qc.prefetchQuery({
					queryKey: practiceKeys.detail(p.id),
					staleTime: 30_000
				})
			}
		}),
		[updatePractice, isUpdatingPractice]
	)

	return (
		<LearnableCardBase
			config={config}
			entity={practice}
			headerRight={headerRight}
			metrics={metrics}
			minHeight={minHeight}
			onEntityClick={onPracticeClick}
			queryClient={queryClient}
			searchQuery={searchQuery}
			showLeavingSoon={showLeavingSoon}
		/>
	)
}

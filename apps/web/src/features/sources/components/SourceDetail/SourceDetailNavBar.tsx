import { useNavigate } from '@tanstack/react-router'
import { type ReactNode, useCallback } from 'react'
import { DetailNavBar, type DetailNavTab } from '~/components/ui/detail-nav-bar'
import { useDetailReviewCounts } from '~/features/reviews/hooks/useDetailReviewCounts'
import type { Source } from '../../types/source.types'
import { SourceParentsPanel } from '../SourceParentsPanel'

type SourceDetailTab = DetailNavTab

interface SourceDetailNavBarProps {
	source: Source
	/**
	 * Content to render on the right side (e.g., close/minimize buttons)
	 */
	afterActions?: ReactNode
	/**
	 * Callback when parent is selected. If not provided, uses default dialog behavior.
	 */
	onParentSelect?: (sourceId: number) => void
	activeTab?: SourceDetailTab
}

export function SourceDetailNavBar({
	source,
	afterActions,
	onParentSelect,
	activeTab = 'home'
}: SourceDetailNavBarProps) {
	const navigate = useNavigate()
	const { unscheduledCount, overdueCount, dueTodayCount } =
		useDetailReviewCounts({
			sourceId: source.id
		})

	const handleTabChange = useCallback(
		(value: DetailNavTab) => {
			if (value === activeTab) return

			if (value === 'reviews') {
				navigate({
					to: '/sources/$sourceId/reviews',
					params: { sourceId: source.id.toString() }
				})
				return
			}

			navigate({
				to: '/sources/$sourceId',
				params: { sourceId: source.id.toString() }
			})
		},
		[activeTab, navigate, source.id]
	)

	return (
		<DetailNavBar
			activeTab={activeTab}
			afterActions={afterActions}
			dueTodayCount={dueTodayCount}
			leftContent={
				<SourceParentsPanel
					onParentSelect={onParentSelect}
					parent={source.parent}
					sourceId={source.id}
				/>
			}
			onTabChange={handleTabChange}
			overdueCount={overdueCount}
			unscheduledCount={unscheduledCount}
		/>
	)
}

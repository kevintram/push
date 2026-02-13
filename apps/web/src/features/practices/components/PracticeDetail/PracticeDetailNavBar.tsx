import { useNavigate, useParams } from '@tanstack/react-router'
import { type ReactNode, useCallback } from 'react'
import { DetailNavBar, type DetailNavTab } from '~/components/ui/detail-nav-bar'
import { useDetailReviewCounts } from '~/features/reviews/hooks/useDetailReviewCounts'

type PracticeDetailTab = DetailNavTab

interface PracticeDetailNavBarProps {
	practiceId?: number
	/**
	 * Content to render on the right side (e.g., close/minimize buttons)
	 */
	afterActions?: ReactNode
	activeTab?: PracticeDetailTab
}

export function PracticeDetailNavBar({
	practiceId,
	afterActions,
	activeTab = 'home'
}: PracticeDetailNavBarProps) {
	const navigate = useNavigate()
	const params = useParams({ strict: false })
	const routePracticeId =
		typeof params.practiceId === 'string'
			? Number.parseInt(params.practiceId, 10)
			: Number.NaN
	const resolvedPracticeId = practiceId ?? routePracticeId
	const hasValidId = Number.isFinite(resolvedPracticeId)
	const { unscheduledCount, overdueCount, dueTodayCount } =
		useDetailReviewCounts(
			hasValidId ? { practiceId: resolvedPracticeId } : undefined
		)

	const handleTabChange = useCallback(
		(value: DetailNavTab) => {
			if (value === activeTab) return
			if (!Number.isFinite(resolvedPracticeId)) return

			if (value === 'reviews') {
				navigate({
					to: '/practices/$practiceId/reviews',
					params: { practiceId: resolvedPracticeId.toString() }
				})
				return
			}

			navigate({
				to: '/practices/$practiceId',
				params: { practiceId: resolvedPracticeId.toString() }
			})
		},
		[activeTab, navigate, resolvedPracticeId]
	)

	return (
		<DetailNavBar
			activeTab={activeTab}
			afterActions={afterActions}
			dueTodayCount={dueTodayCount}
			onTabChange={handleTabChange}
			overdueCount={overdueCount}
			unscheduledCount={unscheduledCount}
		/>
	)
}

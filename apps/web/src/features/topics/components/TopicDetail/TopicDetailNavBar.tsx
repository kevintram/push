import { useNavigate } from '@tanstack/react-router'
import { type ReactNode, useCallback } from 'react'
import { DetailNavBar, type DetailNavTab } from '~/components/ui/detail-nav-bar'
import { useDetailReviewCounts } from '~/features/reviews/hooks/useDetailReviewCounts'
import type { Topic } from '../../types/topic.types'
import { TopicParentsPanel } from '../TopicParentsPanel'

type TopicDetailTab = DetailNavTab

interface TopicDetailNavBarProps {
	topic: Topic
	/**
	 * Content to render on the right side (e.g., close/minimize buttons)
	 */
	afterActions?: ReactNode
	/**
	 * Callback when a parent is selected. If not provided, uses default dialog behavior.
	 */
	onParentSelect?: (topicId: number) => void
	activeTab?: TopicDetailTab
}

export function TopicDetailNavBar({
	topic,
	afterActions,
	onParentSelect,
	activeTab = 'home'
}: TopicDetailNavBarProps) {
	const navigate = useNavigate()
	const { unscheduledCount, overdueCount, dueTodayCount } =
		useDetailReviewCounts({
			topicId: topic.id
		})

	const handleTabChange = useCallback(
		(value: DetailNavTab) => {
			if (value === activeTab) return

			if (value === 'reviews') {
				navigate({
					to: '/topics/$topicId/reviews',
					params: { topicId: topic.id.toString() }
				})
				return
			}

			navigate({
				to: '/topics/$topicId',
				params: { topicId: topic.id.toString() }
			})
		},
		[activeTab, navigate, topic.id]
	)

	return (
		<DetailNavBar
			activeTab={activeTab}
			afterActions={afterActions}
			dueTodayCount={dueTodayCount}
			leftContent={
				<TopicParentsPanel
					onParentSelect={onParentSelect}
					parent={topic.parent}
					topicId={topic.id}
				/>
			}
			onTabChange={handleTabChange}
			overdueCount={overdueCount}
			unscheduledCount={unscheduledCount}
		/>
	)
}

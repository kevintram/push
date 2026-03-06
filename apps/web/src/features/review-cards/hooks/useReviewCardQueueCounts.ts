import { useReviewCardQueueSummary } from '~/features/review-cards/api/getReviewCardQueueSummary'
import type { ReviewCardType } from '~/features/review-cards/types/review-card.types'

type UseReviewCardQueueCountsOptions = {
	type: ReviewCardType
}

export function useReviewCardQueueCounts({
	type
}: UseReviewCardQueueCountsOptions) {
	const { data } = useReviewCardQueueSummary(type)

	return {
		newCount: data?.new_count ?? 0,
		overdueCount: data?.overdue_count ?? 0,
		dueTodayCount: data?.due_today_count ?? 0,
		dueNextSevenDaysCount: data?.due_next_seven_days_count ?? 0
	}
}

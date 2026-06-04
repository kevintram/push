import { useReviewCardQueueSummary } from '~/modules/review-cards/api/getReviewCardQueueSummary'
import type { ReviewCardQueueSummaryParams } from '~/modules/review-cards/types/review-card.types'

export function useReviewCardQueueCounts(
	options: ReviewCardQueueSummaryParams
) {
	const { data } = useReviewCardQueueSummary(options)

	return {
		newCount: data?.new_count ?? 0,
		overdueCount: data?.overdue_count ?? 0,
		dueTodayCount: data?.due_today_count ?? 0,
		dueNextSevenDaysCount: data?.due_next_seven_days_count ?? 0
	}
}

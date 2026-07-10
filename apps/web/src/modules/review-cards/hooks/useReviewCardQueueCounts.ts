import { useReviewCardQueueSummary } from '~/modules/review-cards/api/getReviewCardQueueSummary'
import { type ReviewCardQueueSummaryParams } from '~/modules/review-cards/types/review-card.types'

export function useReviewCardQueueCounts(
	options: ReviewCardQueueSummaryParams,
) {
	const { data } = useReviewCardQueueSummary(options)

	return {
		newCount: data?.newCount ?? 0,
		overdueCount: data?.overdueCount ?? 0,
		dueTodayCount: data?.dueTodayCount ?? 0,
		dueNextSevenDaysCount: data?.dueNextSevenDaysCount ?? 0,
	}
}

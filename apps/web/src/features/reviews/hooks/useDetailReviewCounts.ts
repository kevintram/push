import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useReviews } from '~/features/reviews/api/getReviews'

type ReviewEntityFilters = {
	topicId?: number
	sourceId?: number
	practiceId?: number
}

export function useDetailReviewCounts(filters?: ReviewEntityFilters) {
	const { data: unscheduledReviews = [] } = useReviews(
		filters
			? {
					...filters,
					scheduled: false,
					completed: false
				}
			: undefined
	)

	const { data: scheduledReviews = [] } = useReviews(
		filters
			? {
					...filters,
					scheduled: true,
					completed: false
				}
			: undefined
	)

	const { overdueCount, dueTodayCount } = useMemo(() => {
		const today = dayjs().startOf('day')
		let overdue = 0
		let dueToday = 0

		for (const review of scheduledReviews) {
			const scheduled = dayjs(review.scheduled_at).startOf('day')
			if (scheduled.isBefore(today)) {
				overdue++
			} else if (scheduled.isSame(today)) {
				dueToday++
			}
		}

		return {
			overdueCount: overdue,
			dueTodayCount: dueToday
		}
	}, [scheduledReviews])

	return {
		unscheduledCount: unscheduledReviews.length,
		overdueCount,
		dueTodayCount
	}
}

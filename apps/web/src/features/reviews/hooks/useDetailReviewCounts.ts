import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useReviews } from '~/features/reviews/api/getReviews'

type ReviewEntityFilters = {
	reviewCardId?: number
}

export function useDetailReviewCounts(filters?: ReviewEntityFilters) {
	const entityFilter = { reviewCardId: filters?.reviewCardId }

	const { data: unscheduledReviews = [] } = useReviews({
		...entityFilter,
		scheduled: false,
		completed: false
	})

	const { data: scheduledReviews = [] } = useReviews({
		...entityFilter,
		scheduled: true,
		completed: false
	})

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

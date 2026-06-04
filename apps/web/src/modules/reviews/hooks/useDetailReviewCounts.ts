import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useReviews } from '~/modules/reviews/api/getReviews'

type ReviewCardFilters = {
	reviewCardId?: number
}

export function useDetailReviewCounts(filters?: ReviewCardFilters) {
	const reviewCardFilter = { reviewCardId: filters?.reviewCardId }

	const { data: unscheduledReviews = [] } = useReviews({
		...reviewCardFilter,
		scheduled: false,
		completed: false
	})

	const { data: scheduledReviews = [] } = useReviews({
		...reviewCardFilter,
		scheduled: true,
		completed: false
	})

	const { pendingCount, overdueCount, dueTodayCount } = useMemo(() => {
		const today = dayjs().startOf('day')
		let overdue = 0
		let dueToday = 0
		let pending = unscheduledReviews.length

		for (const review of scheduledReviews) {
			const scheduled = dayjs(review.scheduled_at).startOf('day')
			if (scheduled.isBefore(today)) {
				overdue++
			} else if (scheduled.isSame(today)) {
				dueToday++
			} else {
				pending++
			}
		}

		return {
			pendingCount: pending,
			overdueCount: overdue,
			dueTodayCount: dueToday
		}
	}, [scheduledReviews, unscheduledReviews.length])

	return {
		pendingCount,
		overdueCount,
		dueTodayCount
	}
}

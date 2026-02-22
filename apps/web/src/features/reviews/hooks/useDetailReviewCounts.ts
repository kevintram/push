import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useReviews } from '~/features/reviews/api/getReviews'

type ReviewEntityFilters = {
	noteId?: number
}

export function useDetailReviewCounts(filters?: ReviewEntityFilters) {
	const noteIdFilter =
		filters?.noteId !== undefined ? { noteId: filters.noteId } : { noteId: -1 }

	const { data: unscheduledReviews = [] } = useReviews({
		...noteIdFilter,
		scheduled: false,
		completed: false
	})

	const { data: scheduledReviews = [] } = useReviews({
		...noteIdFilter,
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

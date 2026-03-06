import { useMemo } from 'react'
import { useReviewCardQueue } from '~/features/review-cards/api/getReviewCardQueue'
import type { ReviewCardType } from '~/features/review-cards/types/review-card.types'

type UseReviewCardQueueCountsOptions = {
	type: ReviewCardType
}

export function useReviewCardQueueCounts({
	type
}: UseReviewCardQueueCountsOptions) {
	const { data: dueItems = [] } = useReviewCardQueue({
		type,
		tab: 'due'
	})
	const { data: newItems = [] } = useReviewCardQueue({
		type,
		tab: 'new'
	})

	const dueCounts = useMemo(() => {
		let overdueCount = 0
		let dueTodayCount = 0
		let dueNextSevenDaysCount = 0

		for (const item of dueItems) {
			if (item.days_until_due == null) continue

			if (item.days_until_due < 0) {
				overdueCount++
				continue
			}

			if (item.days_until_due === 0) {
				dueTodayCount++
				continue
			}

			if (item.days_until_due <= 7) {
				dueNextSevenDaysCount++
			}
		}

		return {
			overdueCount,
			dueTodayCount,
			dueNextSevenDaysCount
		}
	}, [dueItems])

	return {
		newCount: newItems.length,
		...dueCounts
	}
}

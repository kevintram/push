import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import type { Review } from '~/models/review-topic.types'
import { getReviews } from '../api/getReviews'

type LogbookSection = {
	id: string
	label: string
	entries: Array<Review>
}

export function useLogbookReviews() {
	const query = useQuery({
		queryKey: ['reviews', 'logbook'],
		queryFn: () => {
			const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
			return getReviews({ completedBefore: yesterday })
		}
	})

	// Group reviews into Yesterday, Last Week, and Monthly sections
	const sections = useMemo(() => {
		if (!query.data) {
			return []
		}

		// Calculate date boundaries
		const today = dayjs()
		const yesterday = today.subtract(1, 'day')
		const yesterdayDateStr = yesterday.format('YYYY-MM-DD')

		// Last week: 6 days ago through 2 days ago (past 7 days excluding yesterday)
		const sixDaysAgo = today.subtract(6, 'day')
		const twoDaysAgo = today.subtract(2, 'day')
		const sixDaysAgoDateStr = sixDaysAgo.format('YYYY-MM-DD')
		const twoDaysAgoDateStr = twoDaysAgo.format('YYYY-MM-DD')

		// Categorize reviews
		const yesterdayReviews: Array<Review> = []
		const lastWeekReviews: Array<Review> = []
		const monthlyGroups = new Map<string, Array<Review>>()

		for (const review of query.data) {
			const effectiveDate = review.effective_date

			// Skip reviews without effective_date
			if (!effectiveDate) {
				continue
			}

			// Yesterday section
			if (effectiveDate === yesterdayDateStr) {
				yesterdayReviews.push(review)
			}
			// Last Week section (6 days ago through 2 days ago)
			else if (
				effectiveDate >= sixDaysAgoDateStr &&
				effectiveDate <= twoDaysAgoDateStr
			) {
				lastWeekReviews.push(review)
			}
			// Monthly sections (everything else)
			else {
				const monthKey = dayjs(effectiveDate).format('YYYY-MM')

				if (!monthlyGroups.has(monthKey)) {
					monthlyGroups.set(monthKey, [])
				}
				const group = monthlyGroups.get(monthKey)
				if (group) {
					group.push(review)
				}
			}
		}

		// Build sections array
		const sectionsArray: Array<LogbookSection> = []

		// Add Yesterday section if it has reviews
		if (yesterdayReviews.length > 0) {
			sectionsArray.push({
				id: 'yesterday',
				label: 'Yesterday',
				entries: yesterdayReviews
			})
		}

		// Add Last Week section if it has reviews
		if (lastWeekReviews.length > 0) {
			sectionsArray.push({
				id: 'last-week',
				label: 'Last Week',
				entries: lastWeekReviews
			})
		}

		// Add monthly sections, sorted by date descending (most recent first)
		const monthlySections: Array<LogbookSection> = Array.from(
			monthlyGroups.entries()
		).map(([monthKey, entries]) => ({
			id: monthKey,
			label: dayjs(`${monthKey}-01`).format('MMMM YYYY'),
			entries
		}))

		// Sort monthly sections by month key descending
		monthlySections.sort((a, b) => b.id.localeCompare(a.id))

		// Add monthly sections to the array
		sectionsArray.push(...monthlySections)

		return sectionsArray
	}, [query.data])

	return {
		sections,
		isLoading: query.isLoading,
		error: query.error
	}
}

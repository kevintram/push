import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import type { Review } from '~/models/review-topic.types'
import { getReviews } from '../api/getReviews'

type FutureSection = {
	id: string
	label: string
	entries: Array<Review>
}

export function useFutureReviews(options?: { enabled?: boolean }) {
	const query = useQuery({
		queryKey: ['reviews', 'future'],
		queryFn: () => {
			const futureStartDate = dayjs().add(8, 'day').format('YYYY-MM-DD')
			return getReviews({
				effectiveDateAfter: futureStartDate,
				completed: false
			})
		},
		enabled: options?.enabled ?? true
	})

	// Group reviews by month
	const sections = useMemo(() => {
		if (!query.data) {
			return []
		}

		const monthlyGroups = new Map<string, Array<Review>>()

		for (const review of query.data) {
			const effectiveDate = review.effective_date

			// Skip reviews without effective_date
			if (!effectiveDate) {
				continue
			}

			const monthKey = dayjs(effectiveDate).format('YYYY-MM')

			if (!monthlyGroups.has(monthKey)) {
				monthlyGroups.set(monthKey, [])
			}
			const group = monthlyGroups.get(monthKey)
			if (group) {
				group.push(review)
			}
		}

		// Convert to array of sections, sorted by month ascending (earliest first)
		const sectionsArray: Array<FutureSection> = Array.from(
			monthlyGroups.entries()
		).map(([monthKey, entries]) => ({
			id: monthKey,
			label: dayjs(`${monthKey}-01`).format('MMMM YYYY'),
			entries
		}))

		// Sort by month key ascending (earliest month first)
		sectionsArray.sort((a, b) => a.id.localeCompare(b.id))

		return sectionsArray
	}, [query.data])

	return {
		sections,
		isLoading: query.isLoading,
		isFetched: query.isFetched,
		error: query.error
	}
}

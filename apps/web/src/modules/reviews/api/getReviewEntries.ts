import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import type { LogbookEntrySection } from '../types/api.types'
import type { ReviewListItem } from '../types/review.types'
import { getReviews } from './getReviews'
import { reviewKeys } from './queryKeys'

const sortReviewsByEffectiveDateDesc = (
	entries: Array<ReviewListItem>
): Array<ReviewListItem> =>
	[...entries].sort((a, b) => {
		if (a.effective_date === b.effective_date) return 0
		if (a.effective_date === null) return 1
		if (b.effective_date === null) return -1
		return a.effective_date < b.effective_date ? 1 : -1
	})

export function useLogbookReviewEntries() {
	const query = useQuery({
		queryKey: reviewKeys.list({
			completed: true,
			order: 'desc'
		}),
		queryFn: () =>
			getReviews({
				completed: true,
				order: 'desc'
			})
	})

	// Group entries into Future, monthly (current year), and yearly (previous years) sections
	const sections = useMemo(() => {
		if (!query.data) {
			return []
		}

		const today = dayjs()
		const todayDateStr = today.format('YYYY-MM-DD')
		const currentYear = today.year()

		// Categorize entries
		const futureEntries: Array<ReviewListItem> = []
		const monthlyGroups = new Map<string, Array<ReviewListItem>>()
		const yearlyGroups = new Map<number, Array<ReviewListItem>>()

		for (const entry of query.data) {
			const effectiveDate = entry.effective_date

			if (!effectiveDate) {
				continue
			}

			if (effectiveDate > todayDateStr) {
				futureEntries.push(entry)
			} else {
				const entryDate = dayjs(effectiveDate)
				const entryYear = entryDate.year()

				if (entryYear === currentYear) {
					// Current year: group by month
					const monthKey = entryDate.format('YYYY-MM')
					if (!monthlyGroups.has(monthKey)) {
						monthlyGroups.set(monthKey, [])
					}
					monthlyGroups.get(monthKey)!.push(entry)
				} else {
					// Previous years: group by year
					if (!yearlyGroups.has(entryYear)) {
						yearlyGroups.set(entryYear, [])
					}
					yearlyGroups.get(entryYear)!.push(entry)
				}
			}
		}

		// Build sections array
		const sectionsArray: Array<LogbookEntrySection> = []

		if (futureEntries.length > 0) {
			sectionsArray.push({
				id: 'future',
				label: 'Future???',
				entries: sortReviewsByEffectiveDateDesc(futureEntries)
			})
		}

		// Monthly sections for current year, sorted descending
		const monthlyKeys = Array.from(monthlyGroups.keys()).sort((a, b) =>
			b.localeCompare(a)
		)
		for (const monthKey of monthlyKeys) {
			const entries = monthlyGroups.get(monthKey)!
			sectionsArray.push({
				id: monthKey,
				label: dayjs(`${monthKey}-01`).format('MMMM'),
				entries: sortReviewsByEffectiveDateDesc(entries)
			})
		}

		// Yearly sections for previous years, sorted descending
		const yearKeys = Array.from(yearlyGroups.keys()).sort((a, b) => b - a)
		for (const year of yearKeys) {
			const entries = yearlyGroups.get(year)!
			sectionsArray.push({
				id: String(year),
				label: String(year),
				entries: sortReviewsByEffectiveDateDesc(entries)
			})
		}

		return sectionsArray
	}, [query.data])

	return {
		sections,
		isLoading: query.isLoading,
		error: query.error
	}
}

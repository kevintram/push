import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import * as v from 'valibot'
import { type Review, ReviewSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

type FutureSection = {
	id: string
	label: string
	entries: Array<Review>
}

async function fetchFutureReviews(): Promise<Array<Review>> {
	const futureStartDate = dayjs().add(8, 'day').format('YYYY-MM-DD')

	// Fetch incomplete reviews with effective_date >= today + 8 days
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/reviews/?effective_date_after=${futureStartDate}&completed=false`
	)
	const data = await response.json()
	try {
		return v.parse(v.array(ReviewSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useFutureReviews(options?: { enabled?: boolean }) {
	const query = useQuery({
		queryKey: ['reviews', 'future'],
		queryFn: fetchFutureReviews,
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

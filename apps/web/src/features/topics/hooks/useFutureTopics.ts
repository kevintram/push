import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import type { Topic } from '~/models/review-topic.types'
import { getTopics } from '../api'

type FutureSection = {
	id: string
	label: string
	entries: Array<Topic>
}

export function useFutureTopics(options?: { enabled?: boolean }) {
	const query = useQuery({
		queryKey: ['topics', 'future'],
		queryFn: () => {
			const futureStartDate = dayjs().add(8, 'day').format('YYYY-MM-DD')
			return getTopics({
				dueAfter: futureStartDate,
				archived: false,
				srsEnabled: true
			})
		},
		enabled: options?.enabled ?? true
	})

	// Group topics by month
	const sections = useMemo(() => {
		if (!query.data) {
			return []
		}

		const monthlyGroups = new Map<string, Array<Topic>>()

		for (const topic of query.data) {
			const dueDate = topic.due

			// Skip topics without due date
			if (!dueDate) {
				continue
			}

			const monthKey = dayjs(dueDate).format('YYYY-MM')

			if (!monthlyGroups.has(monthKey)) {
				monthlyGroups.set(monthKey, [])
			}
			const group = monthlyGroups.get(monthKey)
			if (group) {
				group.push(topic)
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

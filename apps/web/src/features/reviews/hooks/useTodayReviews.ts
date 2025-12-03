import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import type { Review } from '~/models/review-topic.types'
import { getReviews } from '../api'

export type TodaySectionKey = 'overdue' | 'today'

type SectionDefinition = {
	id: TodaySectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
}

const SECTION_DEFINITIONS: Array<SectionDefinition> = [
	{
		id: 'overdue',
		label: 'Overdue',
		headingClassName: 'text-red-600',
		emptyMessage: "You're all caught up—no overdue reviews."
	},
	{
		id: 'today',
		label: 'Today',
		emptyMessage: 'Nothing scheduled for today.'
	}
]

export function useTodayReviews() {
	const query = useQuery({
		queryKey: ['reviews', 'today'],
		queryFn: () => {
			const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
			return getReviews({ effectiveDateBefore: tomorrow })
		}
	})

	const todayDateStr = useMemo(() => {
		return dayjs().format('YYYY-MM-DD')
	}, [])

	const sections = useMemo(() => {
		if (!query.data) {
			return SECTION_DEFINITIONS.map(def => ({
				...def,
				entries: []
			}))
		}

		const overdueList: Array<Review> = []
		const todayList: Array<Review> = []

		for (const entry of query.data) {
			if (entry.effective_date === null) {
				// Skip unscheduled entries
				continue
			}

			// Today: ALL entries (completed and uncompleted) with effective_date for today
			if (entry.effective_date === todayDateStr) {
				todayList.push(entry)
			}
			// Overdue: ONLY incomplete entries with effective_date before today
			else if (
				entry.completed_at === null &&
				entry.effective_date < todayDateStr
			) {
				overdueList.push(entry)
			}
		}

		return SECTION_DEFINITIONS.map(def => {
			const entries = def.id === 'overdue' ? overdueList : todayList

			return {
				...def,
				entries
			}
		})
	}, [query.data, todayDateStr])

	return {
		sections,
		isLoading: query.isLoading,
		error: query.error
	}
}

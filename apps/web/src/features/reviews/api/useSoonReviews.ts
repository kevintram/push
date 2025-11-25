import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import * as v from 'valibot'
import { type Review, ReviewSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

export type SoonSectionKey = 'overdue' | 'today' | 'tomorrow' | 'nextSevenDays'

type SectionDefinition = {
	id: SoonSectionKey
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
	},
	{
		id: 'tomorrow',
		label: 'Tomorrow',
		emptyMessage: 'No reviews scheduled for tomorrow.'
	},
	{
		id: 'nextSevenDays',
		label: 'Next Few Days',
		emptyMessage: 'No reviews scheduled for the next few days.'
	}
]

async function fetchSoonReviews(): Promise<Array<Review>> {
	const nextWeekDate = dayjs().add(8, 'day').format('YYYY-MM-DD')

	// Fetch reviews with effective_date < today + 8 days
	// This includes overdue, today, tomorrow, and next 7 days
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/reviews/?effective_date_before=${nextWeekDate}`
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

export function useSoonReviews() {
	const query = useQuery({
		queryKey: ['reviews', 'soon'],
		queryFn: fetchSoonReviews
	})

	// Centralized date boundary calculations
	const dateBoundaries = useMemo(() => {
		const newDate = new Date()

		const todayDateStr = dayjs(newDate).format('YYYY-MM-DD')

		const tomorrowDate = new Date()
		tomorrowDate.setDate(tomorrowDate.getDate() + 1)
		const tomorrowDateStr = dayjs(tomorrowDate).format('YYYY-MM-DD')

		const nextWeekDate = new Date()
		nextWeekDate.setDate(nextWeekDate.getDate() + 7)
		const nextWeekDateStr = dayjs(nextWeekDate).format('YYYY-MM-DD')

		const dayAfterTomorrowDate = new Date()
		dayAfterTomorrowDate.setDate(dayAfterTomorrowDate.getDate() + 2)
		const dayAfterTomorrowDateStr =
			dayjs(dayAfterTomorrowDate).format('YYYY-MM-DD')

		return {
			todayDateStr,
			tomorrowDateStr,
			nextWeekDateStr,
			dayAfterTomorrowDateStr
		}
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
		const tomorrowList: Array<Review> = []
		const nextSevenDaysList: Array<Review> = []

		for (const entry of query.data) {
			if (entry.effective_date === null) {
				// Skip unscheduled entries in "soon" view
				continue
			}

			// Today: ALL entries (completed and uncompleted) with effective_date for today
			if (entry.effective_date === dateBoundaries.todayDateStr) {
				todayList.push(entry)
			}
			// Tomorrow: ALL entries (completed and uncompleted) with effective_date for tomorrow
			else if (entry.effective_date === dateBoundaries.tomorrowDateStr) {
				tomorrowList.push(entry)
			}
			// Next 7 Days: ALL entries (completed and uncompleted) with effective_date in next 7 days
			else if (
				entry.effective_date >= dateBoundaries.dayAfterTomorrowDateStr &&
				entry.effective_date <= dateBoundaries.nextWeekDateStr
			) {
				nextSevenDaysList.push(entry)
			}
			// Overdue: ONLY incomplete entries with scheduled_at before today
			else if (
				entry.completed_at === null &&
				entry.effective_date < dateBoundaries.todayDateStr
			) {
				overdueList.push(entry)
			}
		}

		return SECTION_DEFINITIONS.map(def => {
			let entries: Array<Review>
			if (def.id === 'overdue') {
				entries = overdueList
			} else if (def.id === 'today') {
				entries = todayList
			} else if (def.id === 'tomorrow') {
				entries = tomorrowList
			} else {
				entries = nextSevenDaysList
			}

			return {
				...def,
				entries
			}
		})
	}, [query.data, dateBoundaries])

	return {
		sections,
		isLoading: query.isLoading,
		error: query.error
	}
}

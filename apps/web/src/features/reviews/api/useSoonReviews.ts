import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import * as v from 'valibot'
import { type Review, ReviewSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

export type SoonSectionKey = 'tomorrow' | 'nextSevenDays'

type SectionDefinition = {
	id: SoonSectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
}

const SECTION_DEFINITIONS: Array<SectionDefinition> = [
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
	const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
	const nextWeekDate = dayjs().add(7, 'day').format('YYYY-MM-DD')
	const searchParams = new URLSearchParams({
		effective_date_after: tomorrow,
		effective_date_before: nextWeekDate
	})
	// Fetch reviews with effective_date between today and today + 7 days
	// This includes today, tomorrow, and next 7 days
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/reviews/?${searchParams.toString()}`
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

		const tomorrowList: Array<Review> = []
		const nextSevenDaysList: Array<Review> = []

		for (const entry of query.data) {
			if (entry.effective_date === null) {
				// Skip unscheduled entries in "soon" view
				continue
			}

			// Tomorrow: ALL entries (completed and uncompleted) with effective_date for tomorrow
			if (entry.effective_date === dateBoundaries.tomorrowDateStr) {
				tomorrowList.push(entry)
			}
			// Next 7 Days: ALL entries (completed and uncompleted) with effective_date in next 7 days
			else if (
				entry.effective_date >= dateBoundaries.dayAfterTomorrowDateStr &&
				entry.effective_date <= dateBoundaries.nextWeekDateStr
			) {
				nextSevenDaysList.push(entry)
			}
		}

		return SECTION_DEFINITIONS.map(def => {
			const entries = def.id === 'tomorrow' ? tomorrowList : nextSevenDaysList

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

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import type { Review } from '~/models/review-topic.types'
import { getReviews } from '../api/getReviews'

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

export function useSoonReviews() {
	const query = useQuery({
		queryKey: ['reviews', 'soon'],
		queryFn: () => {
			const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
			const nextWeekDate = dayjs().add(7, 'day').format('YYYY-MM-DD')
			return getReviews({
				effectiveDateAfter: tomorrow,
				effectiveDateBefore: nextWeekDate
			})
		}
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

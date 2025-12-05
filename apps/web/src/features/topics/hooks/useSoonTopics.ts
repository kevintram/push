import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import type { Topic } from '~/models/review-topic.types'
import { getTopics } from '../api/getTopics'

export type SoonTopicSectionKey = 'tomorrow' | 'nextSevenDays'

type SectionDefinition = {
	id: SoonTopicSectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
}

const SECTION_DEFINITIONS: Array<SectionDefinition> = [
	{
		id: 'tomorrow',
		label: 'Tomorrow',
		emptyMessage: 'No topics due tomorrow.'
	},
	{
		id: 'nextSevenDays',
		label: 'Next Few Days',
		emptyMessage: 'No topics due in the next few days.'
	}
]

export function useSoonTopics() {
	const query = useQuery({
		queryKey: ['topics', 'soon'],
		queryFn: () => {
			const nextWeekDate = dayjs().add(7, 'day').format('YYYY-MM-DD')
			const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
			return getTopics({
				dueAfter: tomorrow,
				dueBefore: nextWeekDate,
				archived: false,
				srsEnabled: true
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
		const topics = query.data ?? []

		const tomorrowList: Array<Topic> = []
		const nextSevenDaysList: Array<Topic> = []

		for (const topic of topics) {
			if (!topic.due) {
				// Skip unscheduled topics (shouldn't happen with our query but be safe)
				continue
			}

			const dueDate = topic.due

			// Tomorrow
			if (dueDate === dateBoundaries.tomorrowDateStr) {
				tomorrowList.push(topic)
			}
			// Next 7 Days
			else if (
				dueDate >= dateBoundaries.dayAfterTomorrowDateStr &&
				dueDate <= dateBoundaries.nextWeekDateStr
			) {
				nextSevenDaysList.push(topic)
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

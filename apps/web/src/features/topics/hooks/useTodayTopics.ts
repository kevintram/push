import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import type { Topic } from '~/models/review-topic.types'
import { getTopics } from '../api/getTopics'

export type TodayTopicSectionKey = 'overdue' | 'today'

type SectionDefinition = {
	id: TodayTopicSectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
}

const SECTION_DEFINITIONS: Array<SectionDefinition> = [
	{
		id: 'overdue',
		label: 'Overdue',
		headingClassName: 'text-red-600',
		emptyMessage: "You're all caught up—no overdue topics."
	},
	{
		id: 'today',
		label: 'Today',
		emptyMessage: 'No topics due today.'
	}
]

export function useTodayTopics() {
	const query = useQuery({
		queryKey: ['topics', 'today'],
		queryFn: () => {
			const today = dayjs().format('YYYY-MM-DD')
			return getTopics({ dueBefore: today, archived: false, srsEnabled: true })
		}
	})

	const todayDateStr = useMemo(() => {
		return dayjs().format('YYYY-MM-DD')
	}, [])

	const sections = useMemo(() => {
		const topics = query.data ?? []

		const overdueList: Array<Topic> = []
		const todayList: Array<Topic> = []

		for (const topic of topics) {
			if (!topic.due) {
				// Skip unscheduled topics (shouldn't happen with our query but be safe)
				continue
			}

			const dueDate = topic.due

			// Today
			if (dueDate === todayDateStr) {
				todayList.push(topic)
			}
			// Overdue
			else if (dueDate < todayDateStr) {
				overdueList.push(topic)
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

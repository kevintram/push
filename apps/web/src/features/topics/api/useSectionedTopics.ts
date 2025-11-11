import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import type { Topic } from '~/models/todo-topic.types'
import { useAllTopics } from './useAllTopics'

export type TopicSectionKey =
	| 'overdue'
	| 'today'
	| 'tomorrow'
	| 'nextSevenDays'
	| 'future'
	| 'noDueDate'

type FilterId = TopicSectionKey

type SectionState = {
	isActive: boolean
	isCollapsed: boolean
}

type SectionStates = Record<TopicSectionKey, SectionState>

type SectionDefinition = {
	id: TopicSectionKey
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
	},
	{
		id: 'tomorrow',
		label: 'Tomorrow',
		emptyMessage: 'No topics due tomorrow.'
	},
	{
		id: 'nextSevenDays',
		label: 'Next Few Days',
		emptyMessage: 'No topics due in the next few days.'
	},
	{
		id: 'future',
		label: 'Future',
		emptyMessage: 'No future topics yet.'
	},
	{
		id: 'noDueDate',
		label: 'No Due Date',
		headingClassName: 'text-gray-600',
		emptyMessage: 'All topics have due dates.'
	}
]

export function useSectionedTopics() {
	const { data: topics = [], isLoading } = useAllTopics()

	const [sectionStates, setSectionStates] = useState<SectionStates>({
		overdue: { isActive: false, isCollapsed: false },
		today: { isActive: false, isCollapsed: false },
		tomorrow: { isActive: false, isCollapsed: false },
		nextSevenDays: { isActive: false, isCollapsed: false },
		future: { isActive: false, isCollapsed: false },
		noDueDate: { isActive: false, isCollapsed: false }
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

		const futureStartDate = new Date()
		futureStartDate.setDate(futureStartDate.getDate() + 8)
		const futureStartDateStr = dayjs(futureStartDate).format('YYYY-MM-DD')

		return {
			todayDateStr,
			tomorrowDateStr,
			nextWeekDateStr,
			dayAfterTomorrowDateStr,
			futureStartDateStr
		}
	}, [])

	const {
		overdue,
		today,
		tomorrow,
		nextSevenDays,
		future,
		noDueDate
	} = useMemo(() => {
		if (!topics) {
			return {
				overdue: [],
				today: [],
				tomorrow: [],
				nextSevenDays: [],
				future: [],
				noDueDate: []
			}
		}

		const overdueList: typeof topics = []
		const todayList: typeof topics = []
		const tomorrowList: typeof topics = []
		const nextSevenDaysList: typeof topics = []
		const futureList: typeof topics = []
		const noDueDateList: typeof topics = []

		for (const topic of topics) {
			// Handle topics without due date
			if (!topic.due) {
				noDueDateList.push(topic)
				continue
			}

			const dueDate = topic.due

			// Today
			if (dueDate === dateBoundaries.todayDateStr) {
				todayList.push(topic)
			}
			// Tomorrow
			else if (dueDate === dateBoundaries.tomorrowDateStr) {
				tomorrowList.push(topic)
			}
			// Next 7 Days
			else if (
				dueDate >= dateBoundaries.dayAfterTomorrowDateStr &&
				dueDate <= dateBoundaries.nextWeekDateStr
			) {
				nextSevenDaysList.push(topic)
			}
			// Overdue
			else if (dueDate < dateBoundaries.todayDateStr) {
				overdueList.push(topic)
			}
			// Future
			else if (dueDate > dateBoundaries.nextWeekDateStr) {
				futureList.push(topic)
			}
		}

		return {
			overdue: overdueList,
			today: todayList,
			tomorrow: tomorrowList,
			nextSevenDays: nextSevenDaysList,
			future: futureList,
			noDueDate: noDueDateList
		}
	}, [
		topics,
		dateBoundaries.todayDateStr,
		dateBoundaries.tomorrowDateStr,
		dateBoundaries.dayAfterTomorrowDateStr,
		dateBoundaries.nextWeekDateStr
	])

	const sectionEntries = useMemo(
		() => ({
			overdue: overdue ?? [],
			today: today ?? [],
			tomorrow: tomorrow ?? [],
			nextSevenDays: nextSevenDays ?? [],
			future: future ?? [],
			noDueDate: noDueDate ?? []
		}),
		[overdue, today, tomorrow, nextSevenDays, future, noDueDate]
	)

	const sections = useMemo(
		() =>
			SECTION_DEFINITIONS.map(definition => ({
				...definition,
				entries: sectionEntries[definition.id],
				isActive: sectionStates[definition.id].isActive,
				isCollapsed: sectionStates[definition.id].isCollapsed
			})),
		[sectionEntries, sectionStates]
	)

	const handleFilterClick = useCallback((filterId: FilterId) => {
		setSectionStates(prev => {
			const isActive = prev[filterId].isActive

			// Toggle the clicked filter
			return {
				...prev,
				[filterId]: { ...prev[filterId], isActive: !isActive }
			}
		})
	}, [])

	const toggleSectionCollapse = useCallback((sectionId: TopicSectionKey) => {
		setSectionStates(prev => ({
			...prev,
			[sectionId]: {
				...prev[sectionId],
				isCollapsed: !prev[sectionId].isCollapsed
			}
		}))
	}, [])

	const handleClearFilters = useCallback(() => {
		setSectionStates(
			prev =>
				Object.fromEntries(
					Object.entries(prev).map(([key, state]) => [
						key,
						{ ...state, isActive: false }
					])
				) as SectionStates
		)
	}, [])

	const filters = useMemo(
		() =>
			SECTION_DEFINITIONS.map(definition => ({
				id: definition.id,
				label: definition.label,
				isActive: sectionStates[definition.id].isActive,
				onClick: () => handleFilterClick(definition.id)
			})),
		[sectionStates, handleFilterClick]
	)

	const filteredSections = useMemo(() => {
		const hasActiveFilters = Object.values(sectionStates).some(
			state => state.isActive
		)

		if (hasActiveFilters) {
			return sections.filter(section => sectionStates[section.id].isActive)
		}

		return sections
	}, [sectionStates, sections])

	return {
		sections,
		filteredSections,
		filters,
		toggleSectionCollapse,
		handleFilterClick,
		handleClearFilters,
		isLoading
	}
}

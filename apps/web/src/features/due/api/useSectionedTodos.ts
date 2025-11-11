import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import * as v from 'valibot'
import { type Todo, TodoSchema } from '~/models/todo-topic.types'
import { apiFetch } from '~/utils/apiFetch'

export type SectionKey =
	| 'overdue'
	| 'today'
	| 'tomorrow'
	| 'nextSevenDays'
	| 'future'
	| 'unscheduled'
	| 'logbook'

type FilterId = SectionKey

type SectionState = {
	isActive: boolean
	isCollapsed: boolean
}

type SectionStates = Record<SectionKey, SectionState>

// Public type for external filter state (only isActive, not isCollapsed)
export type SectionFilterStates = Record<SectionKey, { isActive: boolean }>

type SectionDefinition = {
	id: SectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
	canAdd: boolean
}

const SECTION_DEFINITIONS: Array<SectionDefinition> = [
	{
		id: 'overdue',
		label: 'Overdue',
		headingClassName: 'text-red-600',
		emptyMessage: "You're all caught up—no overdue todos.",
		canAdd: false
	},
	{
		id: 'today',
		label: 'Today',
		emptyMessage: 'Nothing scheduled for today.',
		canAdd: true
	},
	{
		id: 'tomorrow',
		label: 'Tomorrow',
		emptyMessage: 'No todos scheduled for tomorrow.',
		canAdd: true
	},
	{
		id: 'nextSevenDays',
		label: 'Next Few Days',
		emptyMessage: 'No todos scheduled for the next few days.',
		canAdd: true
	},
	{
		id: 'future',
		label: 'Future',
		emptyMessage: 'No future todos yet.',
		canAdd: true
	},
	{
		id: 'unscheduled',
		label: 'Unscheduled',
		headingClassName: 'text-gray-600',
		emptyMessage: 'No unscheduled todos.',
		canAdd: true
	},
	{
		id: 'logbook',
		label: 'Logbook',
		emptyMessage: 'No completed entries yet.',
		canAdd: false
	}
]

const FILTER_ORDER: Array<FilterId> = [
	'overdue',
	'today',
	'tomorrow',
	'nextSevenDays',
	'future',
	'unscheduled',
	'logbook'
]

async function fetchTodos(): Promise<Array<Todo>> {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/todos/`)
	const data = await response.json()
	try {
		return v.parse(v.array(TodoSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

type CreateTodoInput = {
	description: string
	scheduled_at: string | null
}

async function createTodo(input: CreateTodoInput): Promise<Todo> {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/todos/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			description: input.description,
			scheduled_at: input.scheduled_at,
			completed_at: null
		})
	})
	const data = await response.json()
	try {
		return v.parse(TodoSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

type UseSectionedTodosOptions = {
	externalFilterStates?: SectionFilterStates
}

export function useSectionedTodos(options?: UseSectionedTodosOptions) {
	const { externalFilterStates } = options ?? {}
	const queryClient = useQueryClient()

	// Only manage collapse state internally
	const [collapsedStates, setCollapsedStates] = useState<
		Record<SectionKey, boolean>
	>({
		overdue: false,
		today: false,
		tomorrow: false,
		nextSevenDays: false,
		future: false,
		unscheduled: false,
		logbook: false
	})

	// Merge external filter states with internal collapse states
	const sectionStates: SectionStates = useMemo(() => {
		const result: SectionStates = {} as SectionStates
		for (const key of Object.keys(collapsedStates) as Array<SectionKey>) {
			result[key] = {
				isActive: externalFilterStates?.[key]?.isActive ?? false,
				isCollapsed: collapsedStates[key]
			}
		}
		return result
	}, [externalFilterStates, collapsedStates])

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

	const query = useQuery({
		queryKey: ['todos'],
		queryFn: fetchTodos
	})

	const { mutateAsync: insertTodoMutation } = useMutation({
		mutationFn: createTodo,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const {
		overdue,
		today,
		tomorrow,
		nextSevenDays,
		future,
		unscheduled,
		logbook
	} = useMemo(() => {
		if (!query.data) {
			return {
				overdue: [],
				today: [],
				tomorrow: [],
				nextSevenDays: [],
				future: [],
				unscheduled: [],
				logbook: []
			}
		}

		const overdueList: typeof query.data = []
		const todayList: typeof query.data = []
		const tomorrowList: typeof query.data = []
		const nextSevenDaysList: typeof query.data = []
		const upcomingList: typeof query.data = []
		const unscheduledList: typeof query.data = []
		const logbookList: typeof query.data = []

		for (const entry of query.data) {
			// Collect all completed entries for the logbook section
			if (entry.completed_at !== null) {
				logbookList.push(entry)
			}

			// Handle unscheduled entries (no scheduled_at) - only incomplete ones
			if (!entry.scheduled_at) {
				if (entry.completed_at === null) {
					unscheduledList.push(entry)
				}
				continue
			}

			// Use date strings for comparison since columns are now date-only
			const effectiveDateStr = entry.completed_at || entry.scheduled_at || ''
			const scheduledAtStr = entry.scheduled_at

			// Today: ALL entries (completed and uncompleted) with effective_date for today
			if (effectiveDateStr === dateBoundaries.todayDateStr) {
				todayList.push(entry)
			}
			// Tomorrow: ALL entries (completed and uncompleted) with effective_date for tomorrow
			else if (effectiveDateStr === dateBoundaries.tomorrowDateStr) {
				tomorrowList.push(entry)
			}
			// Next 7 Days: ALL entries (completed and uncompleted) with effective_date in next 7 days
			else if (
				effectiveDateStr >= dateBoundaries.dayAfterTomorrowDateStr &&
				effectiveDateStr <= dateBoundaries.nextWeekDateStr
			) {
				nextSevenDaysList.push(entry)
			}
			// Overdue: ONLY incomplete entries with scheduled_at before today
			else if (
				entry.completed_at === null &&
				scheduledAtStr < dateBoundaries.todayDateStr
			) {
				overdueList.push(entry)
			}
			// Upcoming: ONLY incomplete entries with scheduled_at after next week
			else if (
				entry.completed_at === null &&
				scheduledAtStr > dateBoundaries.nextWeekDateStr
			) {
				upcomingList.push(entry)
			}
		}

		// Sort logbook entries by completed_at descending (most recent first)
		logbookList.sort((a, b) => {
			if (!(a.completed_at && b.completed_at)) return 0
			return b.completed_at.localeCompare(a.completed_at)
		})

		return {
			overdue: overdueList,
			today: todayList,
			tomorrow: tomorrowList,
			nextSevenDays: nextSevenDaysList,
			future: upcomingList,
			unscheduled: unscheduledList,
			logbook: logbookList
		}
	}, [
		query.data,
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
			unscheduled: unscheduled ?? [],
			logbook: logbook ?? []
		}),
		[overdue, today, tomorrow, nextSevenDays, future, unscheduled, logbook]
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

	// Note: handleFilterClick is now managed externally
	// This is just a placeholder for the filters array
	const handleFilterClick = useCallback((_filterId: FilterId) => {
		// This will be provided externally
	}, [])

	const toggleSectionCollapse = useCallback((sectionId: SectionKey) => {
		setCollapsedStates(prev => ({
			...prev,
			[sectionId]: !prev[sectionId]
		}))
	}, [])

	// Note: handleClearFilters is now managed externally
	const handleClearFilters = useCallback(() => {
		// This will be provided externally
	}, [])

	const isLogbookActive = sectionStates.logbook.isActive

	const filters = useMemo(
		() =>
			FILTER_ORDER.map(filterId => {
				const section = sections.find(s => s.id === filterId)

				return {
					id: filterId,
					label: section?.label ?? filterId,
					isActive: sectionStates[filterId].isActive,
					onClick: () => handleFilterClick(filterId)
				}
			}).filter(filter => {
				// When logbook is active, hide all other filters
				if (isLogbookActive && filter.id !== 'logbook') {
					return false
				}
				// When any other filter is active, hide logbook
				const hasOtherActiveFilters = Object.entries(sectionStates).some(
					([id, state]) => id !== 'logbook' && state.isActive
				)
				if (hasOtherActiveFilters && filter.id === 'logbook') {
					return false
				}
				// Hide overdue filter when overdue section has no entries
				if (filter.id === 'overdue') {
					const overdueSection = sections.find(s => s.id === 'overdue')
					return overdueSection && overdueSection.entries.length > 0
				}
				return true
			}),
		[sectionStates, handleFilterClick, sections, isLogbookActive]
	)

	const filteredSections = useMemo(() => {
		let sectionsToShow = sections

		const hasActiveFilters = Object.values(sectionStates).some(
			state => state.isActive
		)

		if (hasActiveFilters) {
			sectionsToShow = sections.filter(
				section => sectionStates[section.id].isActive
			)
		} else {
			// Hide overdue and logbook sections when they have no entries
			sectionsToShow = sections.filter(section => {
				if (section.id === 'overdue' && section.entries.length === 0) {
					return false
				}
				if (section.id === 'logbook' && section.entries.length === 0) {
					return false
				}
				return true
			})
		}

		return sectionsToShow
	}, [sectionStates, sections])

	const getSectionStartDate = useCallback(
		(sectionId: SectionKey): string | null => {
			switch (sectionId) {
				case 'today':
					return dateBoundaries.todayDateStr
				case 'tomorrow':
					return dateBoundaries.tomorrowDateStr
				case 'nextSevenDays':
					return dateBoundaries.dayAfterTomorrowDateStr
				case 'future':
					return dateBoundaries.futureStartDateStr
				case 'unscheduled':
					return null
				default:
					return null
			}
		},
		[dateBoundaries]
	)

	const addTodoToSection = useCallback(
		async (sectionId: SectionKey) => {
			const scheduledAt = getSectionStartDate(sectionId)

			const newTodo = await insertTodoMutation({
				description: '',
				scheduled_at: scheduledAt
			})

			return newTodo.id
		},
		[getSectionStartDate, insertTodoMutation]
	)

	return {
		sections,
		filteredSections,
		filters,
		addTodoToSection,
		handleFilterClick,
		toggleSectionCollapse,
		handleClearFilters,
		isLoading: query.isLoading,
		error: query.error,
		// Expose the original data for backward compatibility if needed
		overdue,
		today,
		tomorrow,
		nextSevenDays,
		future,
		unscheduled,
		logbook
	}
}

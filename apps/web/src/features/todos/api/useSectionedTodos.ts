import {
	useInsertMutation,
	useRevalidateTables
} from '@supabase-cache-helpers/postgrest-react-query'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'
import { supabase } from '~/utils/supabase'
import { apiFetch } from '~/utils/apiFetch'

type Topic = {
	id: number
	name: string
	notes: string
	inserted_at: string
	updated_at: string
	user_id: string
	stability: number
	retrievability: number
	is_archived: boolean
	is_inboxed: boolean
}

type Todo = {
	id: number
	scheduled_at: string | null
	completed_at: string | null
	inserted_at: string
	updated_at: string
	description: string
	user_id: string
	topics: Array<Topic>
}

type SectionKey =
	| 'overdue'
	| 'today'
	| 'tomorrow'
	| 'nextSevenDays'
	| 'future'
	| 'unscheduled'
	| 'logbook'

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
		label: 'Next 7 Days',
		emptyMessage: 'No todos scheduled in the next 7 days.',
		canAdd: true
	},
	{
		id: 'future',
		label: 'In the Future',
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

async function fetchTodos(): Promise<Array<Todo>> {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/todos/`)
	return response.json()
}

export function useSectionedTodos() {
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

	const revalidateTables = useRevalidateTables([
		{ schema: 'public', table: 'todos' },
		{ schema: 'public', table: 'todos_today' },
		{ schema: 'public', table: 'todos_with_effective_date' }
	])

	const { mutateAsync: insertTodoMutation } = useInsertMutation(
		supabase.from('todos'),
		['id'],
		'*, todos_topics(topics(id, name))',
		{
			onSuccess: () => {
				revalidateTables()
			}
		}
	)

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
				entries: sectionEntries[definition.id]
			})),
		[sectionEntries]
	)

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

			await insertTodoMutation([
				{
					description: '',
					scheduled_at: scheduledAt
				}
			])
		},
		[getSectionStartDate, insertTodoMutation]
	)

	return {
		sections,
		addTodoToSection,
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

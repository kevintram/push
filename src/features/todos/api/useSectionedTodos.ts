import {
	useInsertMutation,
	useQuery,
	useRevalidateTables
} from '@supabase-cache-helpers/postgrest-react-query'
import { useCallback, useMemo } from 'react'
import { supabase } from '~/utils/supabase'

type SectionKey =
	| 'overdue'
	| 'today'
	| 'tomorrow'
	| 'nextSevenDays'
	| 'future'
	| 'unscheduled'

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
	}
]

export function useSectionedTodos() {
	// Centralized date boundary calculations
	const dateBoundaries = useMemo(() => {
		const todayDate = new Date().toISOString().split('T')[0]
		const todayStart = `${todayDate}T00:00:00.000Z`
		const todayEnd = `${todayDate}T23:59:59.999Z`

		const tomorrowDate = new Date()
		tomorrowDate.setDate(tomorrowDate.getDate() + 1)
		const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0]
		const tomorrowStart = `${tomorrowDateStr}T00:00:00.000Z`
		const tomorrowEnd = `${tomorrowDateStr}T23:59:59.999Z`

		const nextWeek = new Date()
		nextWeek.setDate(nextWeek.getDate() + 7)
		const nextWeekEnd = `${nextWeek.toISOString().split('T')[0]}T23:59:59.999Z`

		const dayAfterTomorrow = new Date()
		dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
		const dayAfterTomorrowStart = `${dayAfterTomorrow.toISOString().split('T')[0]}T00:00:00.000Z`

		const futureStart = new Date(nextWeek)
		futureStart.setDate(futureStart.getDate() + 1)
		const futureStartStr = `${futureStart.toISOString().split('T')[0]}T00:00:00.000Z`

		return {
			todayStart,
			todayEnd,
			tomorrowStart,
			tomorrowEnd,
			nextWeekEnd,
			dayAfterTomorrowStart,
			futureStart: futureStartStr
		}
	}, [])

	const query = useQuery(
		supabase
			.from('todos')
			.select('*, todos_topics(topics(id, name, notes))')
			.order('completed_at', { ascending: true, nullsFirst: true })
			.order('scheduled_at', { ascending: true })
	)

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

	const { overdue, today, tomorrow, nextSevenDays, future, unscheduled } =
		useMemo(() => {
			if (!query.data) {
				return {
					overdue: [],
					today: [],
					tomorrow: [],
					nextSevenDays: [],
					future: [],
					unscheduled: []
				}
			}

			const overdueList: typeof query.data = []
			const todayList: typeof query.data = []
			const tomorrowList: typeof query.data = []
			const nextSevenDaysList: typeof query.data = []
			const upcomingList: typeof query.data = []
			const unscheduledList: typeof query.data = []

			for (const entry of query.data) {
				// Handle unscheduled entries (no scheduled_at) - only incomplete ones
				if (!entry.scheduled_at) {
					if (entry.completed_at === null) {
						unscheduledList.push(entry)
					}
					continue
				}

				const effectiveDate = new Date(
					entry.completed_at || entry.scheduled_at || ''
				)
				const scheduledAt = new Date(entry.scheduled_at)

				// Categorize entries by effective_date and scheduled_at
				const isEffectiveDateToday =
					effectiveDate >= new Date(dateBoundaries.todayStart) &&
					effectiveDate <= new Date(dateBoundaries.todayEnd)
				const isEffectiveDateTomorrow =
					effectiveDate >= new Date(dateBoundaries.tomorrowStart) &&
					effectiveDate <= new Date(dateBoundaries.tomorrowEnd)
				const isEffectiveDateNextSevenDays =
					effectiveDate > new Date(dateBoundaries.tomorrowEnd) &&
					effectiveDate <= new Date(dateBoundaries.nextWeekEnd)

				// Today: ALL entries (completed and uncompleted) with effective_date for today
				if (isEffectiveDateToday) {
					todayList.push(entry)
				}
				// Tomorrow: ALL entries (completed and uncompleted) with effective_date for tomorrow
				else if (isEffectiveDateTomorrow) {
					tomorrowList.push(entry)
				}
				// Next 7 Days: ALL entries (completed and uncompleted) with effective_date in next 7 days
				else if (isEffectiveDateNextSevenDays) {
					nextSevenDaysList.push(entry)
				}
				// Overdue: ONLY incomplete entries with scheduled_at before today (matches red checkbox criteria)
				else if (
					entry.completed_at === null &&
					scheduledAt < new Date(dateBoundaries.todayStart)
				) {
					overdueList.push(entry)
				}
				// Upcoming: ONLY incomplete entries with scheduled_at after next week
				else if (
					entry.completed_at === null &&
					scheduledAt > new Date(dateBoundaries.nextWeekEnd)
				) {
					upcomingList.push(entry)
				}
			}

			return {
				overdue: overdueList,
				today: todayList,
				tomorrow: tomorrowList,
				nextSevenDays: nextSevenDaysList,
				future: upcomingList,
				unscheduled: unscheduledList
			}
		}, [
			query.data,
			dateBoundaries.todayStart,
			dateBoundaries.todayEnd,
			dateBoundaries.tomorrowStart,
			dateBoundaries.tomorrowEnd,
			dateBoundaries.nextWeekEnd
		])

	const sectionEntries = useMemo(
		() => ({
			overdue: overdue ?? [],
			today: today ?? [],
			tomorrow: tomorrow ?? [],
			nextSevenDays: nextSevenDays ?? [],
			future: future ?? [],
			unscheduled: unscheduled ?? []
		}),
		[overdue, today, tomorrow, nextSevenDays, future, unscheduled]
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
					return dateBoundaries.todayStart
				case 'tomorrow':
					return dateBoundaries.tomorrowStart
				case 'nextSevenDays':
					return dateBoundaries.dayAfterTomorrowStart
				case 'future':
					return dateBoundaries.futureStart
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
		unscheduled
	}
}

import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { supabase } from '~/utils/supabase'

export function useTodoEntries() {
	const todayDateStr = dayjs(new Date()).format('YYYY-MM-DD')

	const tomorrowDate = new Date()
	tomorrowDate.setDate(tomorrowDate.getDate() + 1)
	const tomorrowDateStr = dayjs(tomorrowDate).format('YYYY-MM-DD')

	const nextWeekDate = new Date()
	nextWeekDate.setDate(nextWeekDate.getDate() + 7)
	const nextWeekDateStr = dayjs(nextWeekDate).format('YYYY-MM-DD')

	const query = useQuery(
		supabase
			.from('todos')
			.select('*, todos_topics(topics(id, name, notes))')
			.order('completed_at', { ascending: true, nullsFirst: true })
			.order('scheduled_at', { ascending: true })
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

				// Use date strings for comparison since columns are now date-only
				const effectiveDateStr = entry.completed_at || entry.scheduled_at || ''
				const scheduledAtStr = entry.scheduled_at

				// Today: ALL entries (completed and uncompleted) with effective_date for today
				if (effectiveDateStr === todayDateStr) {
					todayList.push(entry)
				}
				// Tomorrow: ALL entries (completed and uncompleted) with effective_date for tomorrow
				else if (effectiveDateStr === tomorrowDateStr) {
					tomorrowList.push(entry)
				}
				// Next 7 Days: ALL entries (completed and uncompleted) with effective_date in next 7 days
				else if (
					effectiveDateStr > tomorrowDateStr &&
					effectiveDateStr <= nextWeekDateStr
				) {
					nextSevenDaysList.push(entry)
				}
				// Overdue: ONLY incomplete entries with scheduled_at before today
				else if (entry.completed_at === null && scheduledAtStr < todayDateStr) {
					overdueList.push(entry)
				}
				// Upcoming: ONLY incomplete entries with scheduled_at after next week
				else if (
					entry.completed_at === null &&
					scheduledAtStr > nextWeekDateStr
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
		}, [query.data, todayDateStr, tomorrowDateStr, nextWeekDateStr])

	return {
		...query,
		overdue,
		today,
		tomorrow,
		nextSevenDays,
		future,
		unscheduled
	}
}

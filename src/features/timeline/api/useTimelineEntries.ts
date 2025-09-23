import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useMemo } from 'react'
import { supabase } from '~/utils/supabase'

export function useTimelineEntries() {
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

	const query = useQuery(
		supabase
			.from('timeline_entries_with_effective_date')
			.select('*, topics(name)')
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

				const effectiveDate = new Date(entry.effective_date || '')
				const scheduledAt = new Date(entry.scheduled_at)

				// Categorize entries by effective_date and scheduled_at
				const isEffectiveDateToday =
					effectiveDate >= new Date(todayStart) &&
					effectiveDate <= new Date(todayEnd)
				const isEffectiveDateTomorrow =
					effectiveDate >= new Date(tomorrowStart) &&
					effectiveDate <= new Date(tomorrowEnd)
				const isEffectiveDateNextSevenDays =
					effectiveDate > new Date(tomorrowEnd) &&
					effectiveDate <= new Date(nextWeekEnd)

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
					scheduledAt < new Date(todayStart)
				) {
					overdueList.push(entry)
				}
				// Upcoming: ONLY incomplete entries with scheduled_at after next week
				else if (
					entry.completed_at === null &&
					scheduledAt > new Date(nextWeekEnd)
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
			todayStart,
			todayEnd,
			tomorrowStart,
			tomorrowEnd,
			nextWeekEnd
		])

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

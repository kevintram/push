import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useMemo } from 'react'
import { supabase } from '~/utils/supabase'

export function useTimelineEntries() {
	const today = new Date().toISOString().split('T')[0]
	const todayStart = `${today}T00:00:00.000Z`
	const todayEnd = `${today}T23:59:59.999Z`

	const query = useQuery(
		supabase
			.from('timeline_entries_with_effective_date')
			.select('*, topics(name)')
			.order('completed_at', { ascending: true, nullsFirst: true })
			.order('scheduled_at', { ascending: true })
	)

	const { overdueEntries, todayEntries, upcomingEntries } = useMemo(() => {
		if (!query.data) {
			return { overdueEntries: [], todayEntries: [], upcomingEntries: [] }
		}

		const overdueList: typeof query.data = []
		const todayList: typeof query.data = []
		const upcomingList: typeof query.data = []

		for (const entry of query.data) {
			const effectiveDate = new Date(entry.effective_date || '')
			const scheduledAt = new Date(entry.scheduled_at || '')

			// Today: entries with effective_date scheduled for today
			const isEffectiveDateToday =
				effectiveDate >= new Date(todayStart) && effectiveDate <= new Date(todayEnd)

			// Today: ALL entries (completed and uncompleted) with effective_date for today
			if (isEffectiveDateToday) {
				todayList.push(entry)
			}
			// Overdue: ONLY incomplete entries with scheduled_at before today (matches red checkbox criteria)
			else if (entry.completed_at === null && scheduledAt < new Date(todayStart)) {
				overdueList.push(entry)
			}
			// Upcoming: ONLY incomplete entries with scheduled_at after today
			else if (entry.completed_at === null && scheduledAt > new Date(todayEnd)) {
				upcomingList.push(entry)
			}
		}

		return { overdueEntries: overdueList, todayEntries: todayList, upcomingEntries: upcomingList }
	}, [query.data, todayStart, todayEnd])

	return {
		...query,
		overdueEntries,
		todayEntries,
		upcomingEntries
	}
}

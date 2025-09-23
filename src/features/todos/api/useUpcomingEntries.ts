import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { supabase } from '~/utils/supabase'

export function useUpcomingEntries() {
	const today = new Date().toISOString().split('T')[0]

	return useQuery(
		supabase
			.from('timeline_entries')
			.select('*, topics(name)')
			.is('completed_at', null)
			.gt('scheduled_at', `${today}T23:59:59.999Z`)
			.order('scheduled_at', { ascending: true })
	)
}

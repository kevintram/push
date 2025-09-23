import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { supabase } from '~/utils/supabase'

export function useTodayEntries() {
	return useQuery(
		supabase
			.from('timeline_entries_today')
			.select('*, topics(name)')
			.order('completed_at', { ascending: true, nullsFirst: true })
			.order('scheduled_at', { ascending: true })
	)
}

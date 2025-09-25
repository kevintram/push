import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

export function useInboxTopics() {
	return useQuery<Array<Tables<'topics'>>>(
		supabase
			.from('topics')
			.select('*')
			.eq('is_inboxed', true)
			.order('inserted_at', { ascending: false })
	)
}

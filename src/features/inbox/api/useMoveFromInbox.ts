import { useUpdateMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { supabase } from '~/utils/supabase'

export function useMoveFromInbox() {
	return useUpdateMutation(supabase.from('topics'), ['id'], '*')
}

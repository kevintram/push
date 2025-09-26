import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

export function useGetPotentialChildren(
	topicId: number | undefined,
	searchQuery?: string,
	options?: Omit<
		UseQueryOptions<Array<Tables<'topics'>>, Error>,
		'queryKey' | 'queryFn'
	>
) {
	return useQuery({
		queryKey: ['potential-children', topicId, searchQuery],
		queryFn: async (): Promise<Array<Tables<'topics'>>> => {
			if (!topicId) return []

			const { data, error } = await supabase.rpc('get_potential_children', {
				topic_id: topicId,
				search_query: searchQuery || undefined
			})

			if (error) throw error
			return data || []
		},
		...options
	})
}

import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '~/utils/supabase'

type PotentialTopic = {
	id: number
	name: string
}

export function useGetPotentialChildren(
	topicId: number | undefined,
	options?: Omit<
		UseQueryOptions<Array<PotentialTopic>, Error>,
		'queryKey' | 'queryFn'
	>
) {
	return useQuery({
		queryKey: ['potential-children', topicId],
		queryFn: async (): Promise<Array<PotentialTopic>> => {
			if (!topicId) return []

			const { data, error } = await supabase.rpc('get_potential_children', {
				topic_id: topicId
			})

			if (error) throw error
			return data || []
		},
		...options
	})
}

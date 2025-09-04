import { useMutation } from '@tanstack/react-query'
import { supabase } from '~/utils/supabase'

export function useCreateRelationship() {
	return useMutation({
		mutationFn: async ({
			parent,
			child
		}: {
			parent: number
			child: number
		}) => {
			const { data, error } = await supabase.rpc('insert_relationship', {
				parent,
				child
			})

			if (error) throw error
			return data
		}
	})
}

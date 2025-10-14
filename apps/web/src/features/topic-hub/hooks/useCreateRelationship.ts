import { useRevalidateTables } from '@supabase-cache-helpers/postgrest-react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '~/utils/supabase'

export function useCreateRelationship(onSuccess?: () => void) {
	const queryClient = useQueryClient()
	const revalidateTables = useRevalidateTables([
		{
			table: 'topics_closure'
		},
		{
			table: 'topics'
		}
	])

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
		},
		onSuccess: async () => {
			onSuccess?.()
			await revalidateTables() // revalidate topics_closure and topics

			// Invalidate potential relationships cache since the graph has changed
			await queryClient.invalidateQueries({
				queryKey: ['potential-children']
			})
			await queryClient.invalidateQueries({
				queryKey: ['potential-parents']
			})
		}
	})
}

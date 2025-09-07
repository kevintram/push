import { useRevalidateTables } from '@supabase-cache-helpers/postgrest-react-query'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '~/utils/supabase'

export function useDeleteRelationship() {
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
			const { data, error } = await supabase.rpc('delete_relationship', {
				parent,
				child
			})

			if (error) throw error
			return data
		},
		onSuccess: async () => {
			await revalidateTables() // revalidate topics_closure and topics
		}
	})
}

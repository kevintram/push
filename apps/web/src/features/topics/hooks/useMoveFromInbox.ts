import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'
import { updateTopic } from '../api/updateTopic'

export function useMoveFromInbox() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateTopic,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createReview } from '~/features/reviews/api/createReview'

export function useCreateReview() {
	const queryClient = useQueryClient()

	const { mutateAsync, isPending } = useMutation({
		mutationFn: createReview,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
		}
	})

	return {
		createReview: mutateAsync,
		isPending
	}
}

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Review } from '../types/review.types'
import { reviewCardQueries, reviewQueries } from './queries'

export async function deleteReview(id: number | string): Promise<void> {
	const url = new URL(import.meta.env.VITE_API_URL + `/reviews/${id}/`)
	const response = await fetch(url, {
		method: 'DELETE',
		credentials: 'include',
	})
	if (!response.ok) {
		throw new Error(`Failed to delete review ${id}: ${response.status}`)
	}
}

export function useDeleteReview() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: deleteReview,
		onSuccess: (_, id) => {
			queryClient.setQueriesData<Array<Review>>(
				{ queryKey: reviewQueries.all },
				reviews => reviews?.filter(review => review.id !== Number(id)),
			)
			void queryClient.invalidateQueries({
				queryKey: reviewCardQueries.lists(),
			})
		},
	})
}

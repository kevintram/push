import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import type { Review } from '../types/review.types'
import { reviewCardQueries, reviewQueries } from './queries'

export async function deleteReview(id: string): Promise<void> {
	await apiFetch(v.unknown(), `/reviews/${id}/`, {
		method: 'DELETE',
	})
}

export function useDeleteReview() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: deleteReview,
		meta: { errorMessage: 'Failed to delete review' },
		onSuccess: (_, id) => {
			queryClient.setQueriesData<Array<Review>>(
				{ queryKey: reviewQueries.all },
				reviews => reviews?.filter(review => review.id !== id),
			)
			void queryClient.invalidateQueries({
				queryKey: reviewCardQueries.lists(),
			})
		},
	})
}

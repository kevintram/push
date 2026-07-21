import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import { apiFetch } from '~/utils/apiFetch'

import { reviewCardQueries, reviewQueries } from './queries'

export async function deleteReviewCard(id: string): Promise<void> {
	await apiFetch(v.unknown(), `/review-cards/${id}/`, {
		method: 'DELETE',
	})
}

export function useDeleteReviewCard() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: deleteReviewCard,
		onSuccess: (_, id) => {
			queryClient.removeQueries({
				queryKey: reviewCardQueries.detail(id).queryKey,
			})
			queryClient.removeQueries({
				queryKey: reviewQueries.forCard(id),
			})
			void queryClient.invalidateQueries({
				queryKey: reviewCardQueries.lists(),
			})
		},
	})
}

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from '~/utils/apiFetch'

import { reviewCardQueries, reviewQueries } from './queries'

export async function deleteReviewCard(id: number | string): Promise<void> {
	const url = new URL(import.meta.env.VITE_API_URL + `/review-cards/${id}/`)
	const response = await apiFetch(url, {
		method: 'DELETE',
	})
	if (!response.ok) {
		throw new Error(
			`Failed to delete review card ${id}: ${response.status}`,
		)
	}
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

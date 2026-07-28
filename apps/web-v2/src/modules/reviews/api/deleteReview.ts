import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import { mutationScopes, optimisticMutationKeys } from '~/lib/mutationConfig'
import {
	combineRollbacks,
	type OptimisticContext,
	type Rollback,
} from '~/lib/optimistic'
import { invalidateAfterOptimisticBatch } from '~/lib/optimisticInvalidation'
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
		mutationKey: [...optimisticMutationKeys.reviews, 'delete'],
		scope: mutationScopes.reviews,
		mutationFn: deleteReview,
		meta: { errorMessage: 'Failed to delete review' },
		onMutate: async (id): Promise<OptimisticContext> => {
			await queryClient.cancelQueries({ queryKey: reviewQueries.all })

			const rollbacks: Array<Rollback> = []
			for (const [queryKey, reviews] of queryClient.getQueriesData<
				Array<Review>
			>({ queryKey: reviewQueries.lists() })) {
				const index =
					reviews?.findIndex(review => review.id === id) ?? -1
				if (!reviews || index < 0) continue
				const removed = reviews[index]!
				queryClient.setQueryData<Array<Review>>(
					queryKey,
					reviews.filter(review => review.id !== id),
				)
				rollbacks.push(() => {
					queryClient.setQueryData<Array<Review>>(
						queryKey,
						current => {
							if (
								!current ||
								current.some(review => review.id === id)
							)
								return current
							const next = [...current]
							next.splice(
								Math.min(index, next.length),
								0,
								removed,
							)
							return next
						},
					)
				})
			}

			return { rollback: combineRollbacks(rollbacks) }
		},
		onError: (_error, _id, context) => context?.rollback(),
		onSettled: () =>
			invalidateAfterOptimisticBatch(queryClient, [
				reviewQueries.all,
				reviewCardQueries.all,
			]),
	})
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'

import { mutationScopes, optimisticMutationKeys } from '~/lib/mutationConfig'
import {
	combineRollbacks,
	type OptimisticContext,
	type Rollback,
} from '~/lib/optimistic'
import {
	excludeDeletedFromOptimisticBatch,
	invalidateAfterOptimisticBatch,
} from '~/lib/optimisticInvalidation'
import { apiFetch } from '~/utils/apiFetch'

import type { ReviewCard } from '../types/review.types'
import { reviewCardQueries, reviewQueries } from './queries'

export async function deleteReviewCard(id: string): Promise<void> {
	await apiFetch(v.unknown(), `/review-cards/${id}/`, {
		method: 'DELETE',
	})
}

export function useDeleteReviewCard() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: [...optimisticMutationKeys.reviewCards, 'delete'],
		scope: mutationScopes.reviewCards,
		mutationFn: deleteReviewCard,
		meta: { errorMessage: 'Failed to delete review card' },
		onMutate: async (id): Promise<OptimisticContext> => {
			await Promise.all([
				queryClient.cancelQueries({ queryKey: reviewCardQueries.all }),
				queryClient.cancelQueries({ queryKey: reviewQueries.all }),
			])

			const rollbacks: Array<Rollback> = []
			for (const [queryKey, cards] of queryClient.getQueriesData<
				Array<ReviewCard>
			>({ queryKey: reviewCardQueries.lists() })) {
				const index = cards?.findIndex(card => card.id === id) ?? -1
				if (!cards || index < 0) continue
				const removed = cards[index]!
				queryClient.setQueryData<Array<ReviewCard>>(
					queryKey,
					cards.filter(card => card.id !== id),
				)
				rollbacks.push(() => {
					queryClient.setQueryData<Array<ReviewCard>>(
						queryKey,
						current => {
							if (
								!current ||
								current.some(card => card.id === id)
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
		onSuccess: (_, id) => {
			const deletedKeys = [
				reviewCardQueries.detail(id).queryKey,
				reviewQueries.forCard(id),
			]
			for (const queryKey of deletedKeys) {
				queryClient.removeQueries({ queryKey, type: 'inactive' })
			}
			// Mounted queries survive `removeQueries`, so keep the settled
			// invalidation from refetching them into a 404.
			excludeDeletedFromOptimisticBatch(queryClient, deletedKeys)
		},
		onSettled: () =>
			invalidateAfterOptimisticBatch(queryClient, [
				reviewCardQueries.all,
				reviewQueries.all,
			]),
	})
}

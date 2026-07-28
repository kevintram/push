import { useMutation, useQueryClient } from '@tanstack/react-query'

import { mutationScopes, optimisticMutationKeys } from '~/lib/mutationConfig'
import {
	combineRollbacks,
	type OptimisticContext,
	type Rollback,
} from '~/lib/optimistic'
import { invalidateAfterOptimisticBatch } from '~/lib/optimisticInvalidation'
import type { DateString } from '~/types/date'
import { apiFetch } from '~/utils/apiFetch'

import { ReviewSchema } from '../types/review.schemas'
import type { Rating, Review } from '../types/review.types'
import { reviewCardQueries, reviewQueries } from './queries'

export type UpdateReviewInput = {
	id: string
	rating?: Rating | null
	description?: string
	notes?: string
	scheduled_at?: DateString | null
	completed_at?: DateString | null
}

export async function updateReview({
	id,
	...updates
}: UpdateReviewInput): Promise<Review> {
	return apiFetch(ReviewSchema, `/reviews/${id}/`, {
		method: 'POST',
		body: updates,
	})
}

export function useUpdateReview() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: [...optimisticMutationKeys.reviews, 'update'],
		scope: mutationScopes.reviews,
		mutationFn: updateReview,
		meta: { errorMessage: 'Failed to update review' },
		onMutate: async ({ id, ...updates }): Promise<OptimisticContext> => {
			const changesScheduling =
				'rating' in updates ||
				'completed_at' in updates ||
				'scheduled_at' in updates
			if (changesScheduling) return { rollback: () => undefined }

			await queryClient.cancelQueries({ queryKey: reviewQueries.all })
			const changes: Partial<Pick<Review, 'description' | 'notes'>> = {
				...('description' in updates
					? { description: updates.description }
					: {}),
				...('notes' in updates ? { notes: updates.notes } : {}),
			}
			const rollbacks: Array<Rollback> = []
			for (const [queryKey, reviews] of queryClient.getQueriesData<
				Array<Review>
			>({ queryKey: reviewQueries.lists() })) {
				const review = reviews?.find(existing => existing.id === id)
				if (!reviews || !review) continue
				const previous = Object.fromEntries(
					Object.keys(changes).map(key => [
						key,
						review[key as keyof Review],
					]),
				) as Partial<Pick<Review, 'description' | 'notes'>>
				queryClient.setQueryData<Array<Review>>(
					queryKey,
					reviews.map(existing =>
						existing.id === id
							? { ...existing, ...changes }
							: existing,
					),
				)
				rollbacks.push(() => {
					queryClient.setQueryData<Array<Review>>(queryKey, current =>
						current?.map(existing =>
							existing.id === id
								? { ...existing, ...previous }
								: existing,
						),
					)
				})
			}

			return { rollback: combineRollbacks(rollbacks) }
		},
		onError: (_error, _updates, context) => context?.rollback(),
		onSettled: (_data, _error, updates) => {
			const changesScheduling =
				'rating' in updates ||
				'completed_at' in updates ||
				'scheduled_at' in updates
			return invalidateAfterOptimisticBatch(
				queryClient,
				changesScheduling
					? [reviewQueries.all, reviewCardQueries.all]
					: [reviewQueries.all],
			)
		},
	})
}

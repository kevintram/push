import { useMutation, useQueryClient } from '@tanstack/react-query'

import { mutationScopes, optimisticMutationKeys } from '~/lib/mutationConfig'
import {
	combineRollbacks,
	type OptimisticContext,
	type Rollback,
} from '~/lib/optimistic'
import { invalidateAfterOptimisticBatch } from '~/lib/optimisticInvalidation'
import { apiFetch } from '~/utils/apiFetch'

import { ReviewCardSchema } from '../types/review.schemas'
import type { Review, ReviewCard } from '../types/review.types'
import { reviewCardQueries, reviewQueries } from './queries'

export type UpdateReviewCardInput = {
	id: string
	type?: 'practice' | 'flashcard'
	primary_text?: string
	secondary_text?: string
	notes?: string
	flagged?: boolean
}

export async function updateReviewCard({
	id,
	...updates
}: UpdateReviewCardInput): Promise<ReviewCard> {
	return apiFetch(ReviewCardSchema, `/review-cards/${id}/`, {
		method: 'PATCH',
		body: updates,
	})
}

type ReviewCardChanges = Partial<
	Pick<
		ReviewCard,
		'flagged_at' | 'notes' | 'primary_text' | 'secondary_text' | 'type'
	>
>

type ReviewCardSummaryChanges = Partial<Review['review_card']>

export function useUpdateReviewCard() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: [...optimisticMutationKeys.reviewCards, 'update'],
		scope: mutationScopes.reviewCards,
		mutationFn: updateReviewCard,
		meta: { errorMessage: 'Failed to update review card' },
		onMutate: async ({ id, ...updates }): Promise<OptimisticContext> => {
			await Promise.all([
				queryClient.cancelQueries({ queryKey: reviewCardQueries.all }),
				queryClient.cancelQueries({ queryKey: reviewQueries.all }),
			])

			const changes: ReviewCardChanges = {
				...('type' in updates ? { type: updates.type } : {}),
				...('primary_text' in updates
					? { primary_text: updates.primary_text }
					: {}),
				...('secondary_text' in updates
					? { secondary_text: updates.secondary_text }
					: {}),
				...('notes' in updates ? { notes: updates.notes } : {}),
				...('flagged' in updates
					? {
							flagged_at: updates.flagged
								? new Date().toISOString()
								: null,
						}
					: {}),
			}
			const rollbacks: Array<Rollback> = []
			const detailKey = reviewCardQueries.detail(id).queryKey
			const detail = queryClient.getQueryData<ReviewCard>(detailKey)
			if (detail) {
				const previous = Object.fromEntries(
					Object.keys(changes).map(key => [
						key,
						detail[key as keyof ReviewCard],
					]),
				) as ReviewCardChanges
				queryClient.setQueryData<ReviewCard>(detailKey, {
					...detail,
					...changes,
				})
				rollbacks.push(() => {
					queryClient.setQueryData<ReviewCard>(detailKey, current =>
						current?.id === id
							? { ...current, ...previous }
							: current,
					)
				})
			}

			for (const [queryKey, cards] of queryClient.getQueriesData<
				Array<ReviewCard>
			>({ queryKey: reviewCardQueries.lists() })) {
				const card = cards?.find(existing => existing.id === id)
				if (!cards || !card) continue
				const previous = Object.fromEntries(
					Object.keys(changes).map(key => [
						key,
						card[key as keyof ReviewCard],
					]),
				) as ReviewCardChanges
				queryClient.setQueryData<Array<ReviewCard>>(
					queryKey,
					cards.map(existing =>
						existing.id === id
							? { ...existing, ...changes }
							: existing,
					),
				)
				rollbacks.push(() => {
					queryClient.setQueryData<Array<ReviewCard>>(
						queryKey,
						current =>
							current?.map(existing =>
								existing.id === id
									? { ...existing, ...previous }
									: existing,
							),
					)
				})
			}

			const summaryChanges: ReviewCardSummaryChanges = {
				...('type' in changes ? { type: changes.type } : {}),
				...('primary_text' in changes
					? { primary_text: changes.primary_text }
					: {}),
				...('secondary_text' in changes
					? { secondary_text: changes.secondary_text }
					: {}),
			}
			if (Object.keys(summaryChanges).length > 0) {
				for (const [queryKey, reviews] of queryClient.getQueriesData<
					Array<Review>
				>({ queryKey: reviewQueries.lists() })) {
					const review = reviews?.find(
						existing => existing.review_card.id === id,
					)
					if (!reviews || !review) continue
					const previous = Object.fromEntries(
						Object.keys(summaryChanges).map(key => [
							key,
							review.review_card[
								key as keyof Review['review_card']
							],
						]),
					) as ReviewCardSummaryChanges
					queryClient.setQueryData<Array<Review>>(
						queryKey,
						reviews.map(existing =>
							existing.review_card.id === id
								? {
										...existing,
										review_card: {
											...existing.review_card,
											...summaryChanges,
										},
									}
								: existing,
						),
					)
					rollbacks.push(() => {
						queryClient.setQueryData<Array<Review>>(
							queryKey,
							current =>
								current?.map(existing =>
									existing.review_card.id === id
										? {
												...existing,
												review_card: {
													...existing.review_card,
													...previous,
												},
											}
										: existing,
								),
						)
					})
				}
			}

			return { rollback: combineRollbacks(rollbacks) }
		},
		onError: (_error, _updates, context) => context?.rollback(),
		onSettled: () =>
			invalidateAfterOptimisticBatch(queryClient, [
				reviewCardQueries.all,
				reviewQueries.all,
			]),
	})
}

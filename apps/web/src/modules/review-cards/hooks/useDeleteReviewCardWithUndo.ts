import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { toast } from 'sonner'

import { reviewQueueKeys } from '~/modules/reviews/api/queryKeys'
import { searchKeys } from '~/modules/search/api/searchAll'

import { deleteReviewCard } from '../api/deleteReviewCard'
import { reviewCardKeys } from '../api/queryKeys'
import {
	type ReviewCard,
	type ReviewCardQueuePage,
} from '../types/review-card.types'

const UNDO_DELAY_MS = 5000

export function useDeleteReviewCardWithUndo() {
	const queryClient = useQueryClient()
	const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const deleteWithUndo = useCallback(
		(
			reviewCardId: number,
			options?: {
				onOptimisticDelete?: () => void
				onUndo?: () => void
			},
		) => {
			if (pendingRef.current != null) {
				clearTimeout(pendingRef.current)
				pendingRef.current = null
			}

			queryClient.cancelQueries({ queryKey: reviewCardKeys.all })
			queryClient.cancelQueries({ queryKey: reviewQueueKeys.all })
			queryClient.cancelQueries({ queryKey: searchKeys.all })

			queryClient.setQueriesData<Array<ReviewCard>>(
				{ queryKey: ['review-cards', 'list'] },
				old => old?.filter(card => card.id !== reviewCardId),
			)

			queryClient.setQueriesData<ReviewCardQueuePage>(
				{ queryKey: ['review-cards', 'queue'] },
				old =>
					old
						? {
								...old,
								items: old.items.filter(
									item => item.card.id !== reviewCardId,
								),
							}
						: old,
			)

			queryClient.removeQueries({
				queryKey: reviewCardKeys.detail(reviewCardId),
			})

			options?.onOptimisticDelete?.()

			const invalidateAll = () =>
				Promise.all([
					queryClient.invalidateQueries({
						queryKey: reviewCardKeys.all,
					}),
					queryClient.invalidateQueries({
						queryKey: reviewQueueKeys.all,
					}),
					queryClient.invalidateQueries({ queryKey: searchKeys.all }),
				])

			const timeoutId = setTimeout(() => {
				pendingRef.current = null
				deleteReviewCard(reviewCardId)
					.then(() => invalidateAll())
					.catch(() => {
						toast.error('Failed to delete review card')
						invalidateAll()
					})
			}, UNDO_DELAY_MS)

			pendingRef.current = timeoutId

			toast.success('Review card deleted', {
				duration: UNDO_DELAY_MS,
				action: {
					label: 'Undo',
					onClick: () => {
						if (pendingRef.current != null) {
							clearTimeout(pendingRef.current)
							pendingRef.current = null
						}
						invalidateAll()
						toast.success('Deletion undone')
						options?.onUndo?.()
					},
				},
			})
		},
		[queryClient],
	)

	return { deleteWithUndo }
}

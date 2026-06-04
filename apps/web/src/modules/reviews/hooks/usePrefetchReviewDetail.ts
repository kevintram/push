import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { reviewDetailQueryOptions } from '../api/getReviews'
import { reviewKeys } from '../api/queryKeys'
import type { ReviewListItem } from '../types/review.types'

export const REVIEW_DETAIL_INTENT_PRELOAD_DELAY = 100

export function usePrefetchReviewDetail(review: ReviewListItem) {
	const queryClient = useQueryClient()
	const preloadTimeoutRef = useRef<number | null>(null)

	const cancelReviewDetailPreload = useCallback(() => {
		if (preloadTimeoutRef.current != null) {
			window.clearTimeout(preloadTimeoutRef.current)
			preloadTimeoutRef.current = null
		}
	}, [])

	const seedReviewDetail = useCallback(() => {
		if (review.id == null || review.id < 0) return

		// Keep the dialog's immediate render aligned with the latest row snapshot,
		// but mark it stale so prefetch/open still revalidate the detail endpoint.
		queryClient.setQueryData(reviewKeys.detail(review.id), review, {
			updatedAt: 0
		})
	}, [queryClient, review])

	const preloadReviewDetail = useCallback(() => {
		if (review.id == null || review.id < 0) return

		seedReviewDetail()
		queryClient
			.prefetchQuery(reviewDetailQueryOptions(review.id))
			.catch(() => {})
	}, [queryClient, review.id, seedReviewDetail])

	const scheduleReviewDetailPreload = useCallback(
		(delay = REVIEW_DETAIL_INTENT_PRELOAD_DELAY) => {
			if (review.id == null || review.id < 0) return

			cancelReviewDetailPreload()

			if (delay <= 0) {
				preloadReviewDetail()
				return
			}

			preloadTimeoutRef.current = window.setTimeout(() => {
				preloadTimeoutRef.current = null
				preloadReviewDetail()
			}, delay)
		},
		[cancelReviewDetailPreload, preloadReviewDetail, review.id]
	)

	useEffect(() => cancelReviewDetailPreload, [cancelReviewDetailPreload])

	return {
		seedReviewDetail,
		preloadReviewDetail,
		scheduleReviewDetailPreload,
		cancelReviewDetailPreload
	}
}
